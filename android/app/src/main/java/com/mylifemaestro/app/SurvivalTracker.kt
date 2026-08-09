package com.mylifemaestro.app

import android.content.Context
import android.util.Log
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * 감시 서비스가 얼마나 오래 살아남는지 기록한다.
 *
 * ■ 왜 필요한가
 *   삼성 등 제조사는 백그라운드 서비스를 **몇 시간이 아니라 며칠 뒤에** 조용히 죽인다.
 *   죽는 순간을 사람이 지켜볼 수 없고, logcat 버퍼는 금방 덮어써진다.
 *   그래서 파일에 남겨야 나중에 "언제 죽었는지"를 알 수 있다.
 *
 * ■ 판정 방법
 *   서비스가 살아있는 동안 주기적으로 "마지막 생존 시각"을 갱신한다.
 *   나중에 확인했을 때 그 값이 방금이면 살아있는 것이고,
 *   이틀 전에 멈춰 있으면 그때 죽은 것이다.
 */
object SurvivalTracker {

    private const val TAG = "SurvivalTracker"
    private const val PREFS = "survival_tracker"

    private const val KEY_STARTED_AT = "started_at"
    private const val KEY_LAST_ALIVE = "last_alive"
    private const val KEY_BOOT_COUNT = "boot_count"
    private const val KEY_START_COUNT = "start_count"

    private val formatter = SimpleDateFormat("MM-dd HH:mm:ss", Locale.KOREA)

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** 서비스가 처음 켜질 때 호출. 기존 기록이 있으면 이어서 센다. */
    fun onServiceStart(context: Context) {
        val p = prefs(context)
        val now = System.currentTimeMillis()

        if (p.getLong(KEY_STARTED_AT, 0L) == 0L) {
            p.edit().putLong(KEY_STARTED_AT, now).apply()
            Log.i(TAG, "생존 측정 시작")
        }

        p.edit()
            .putLong(KEY_LAST_ALIVE, now)
            .putInt(KEY_START_COUNT, p.getInt(KEY_START_COUNT, 0) + 1)
            .apply()
    }

    /** 감시 루프가 돌 때마다 호출. 잦은 디스크 쓰기를 막기 위해 1분에 한 번만 저장한다. */
    fun heartbeat(context: Context) {
        val p = prefs(context)
        val now = System.currentTimeMillis()
        val last = p.getLong(KEY_LAST_ALIVE, 0L)

        if (now - last < 60_000) return
        p.edit().putLong(KEY_LAST_ALIVE, now).apply()
    }

    /** 재부팅으로 서비스가 되살아난 횟수. */
    fun onBootRecovery(context: Context) {
        val p = prefs(context)
        p.edit().putInt(KEY_BOOT_COUNT, p.getInt(KEY_BOOT_COUNT, 0) + 1).apply()
    }

    /** 측정 기록을 지우고 새로 시작한다. 3일 테스트를 새로 돌릴 때 쓴다. */
    fun reset(context: Context) {
        prefs(context).edit().clear().apply()
        Log.i(TAG, "생존 기록 초기화됨")
    }

    /**
     * 현재까지의 생존 상태를 로그로 출력한다.
     * `adb logcat -s SurvivalTracker` 로 확인한다.
     */
    fun logStatus(context: Context) {
        val p = prefs(context)
        val startedAt = p.getLong(KEY_STARTED_AT, 0L)
        val lastAlive = p.getLong(KEY_LAST_ALIVE, 0L)
        val bootCount = p.getInt(KEY_BOOT_COUNT, 0)
        val startCount = p.getInt(KEY_START_COUNT, 0)

        Log.i(TAG, "===== 생존 기록 =====")

        if (startedAt == 0L) {
            Log.i(TAG, "아직 측정 시작 전")
            Log.i(TAG, "=====================")
            return
        }

        val now = System.currentTimeMillis()
        val elapsed = now - startedAt
        val sinceAlive = now - lastAlive

        Log.i(TAG, "측정 시작: ${formatter.format(Date(startedAt))}")
        Log.i(TAG, "마지막 생존 확인: ${formatter.format(Date(lastAlive))}")
        Log.i(TAG, "총 경과: ${humanize(elapsed)}")
        Log.i(TAG, "서비스 시작 횟수: ${startCount}회 (재부팅 복구 ${bootCount}회)")

        // 하트비트가 1분 주기이므로, 5분 넘게 갱신이 없으면 그 사이 죽어 있었다는 뜻이다
        val verdict = when {
            sinceAlive < 5 * 60_000 -> "✅ 살아있음"
            else -> "🔴 ${humanize(sinceAlive)} 동안 멈춰 있었음 → 그 시점에 죽었다가 방금 되살아남"
        }
        Log.i(TAG, "판정: $verdict")
        Log.i(TAG, "=====================")
    }

    private fun humanize(ms: Long): String {
        val sec = ms / 1000
        val d = sec / 86400
        val h = (sec % 86400) / 3600
        val m = (sec % 3600) / 60
        return buildString {
            if (d > 0) append("${d}일 ")
            if (h > 0) append("${h}시간 ")
            append("${m}분")
        }
    }
}
