package com.mylifemaestro.app

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * 끝난 잠금들의 기록. 리포트의 **'지켜낸 시간'** 이 여기서 나온다.
 *
 * ■ 왜 필요한가
 *   기존에는 웹이 "설정한 시간"(`focusDurationMinutes`)을 그대로 더하고 있었다.
 *   60분을 걸고 10분 만에 미션으로 풀어도 60분 지켜낸 것으로 기록됐다.
 *   지켜낸 시간은 **실제로 잠금이 유지된 시간**이어야 한다.
 *
 * ■ 왜 네이티브가 기록하는가
 *   잠금은 앱이 꺼져 있는 동안에도 끝난다(시간 만료).
 *   웹이 기록하면 앱을 열어봐야만 남으므로 빠지는 기록이 생긴다.
 *
 * ■ 저장 방식
 *   기록 수가 많지 않아(하루 몇 건) SharedPreferences 에 JSON 배열로 둔다.
 *   오래된 것은 자동으로 잘라내 무한정 커지지 않게 한다.
 */
object LockHistoryStore {

    private const val TAG = "LockHistory"
    private const val PREFS = "lock_history"
    private const val KEY_ENTRIES = "entries"

    /** 보관 기간. 리포트가 주간 단위이므로 넉넉히 이 정도면 된다. */
    private const val RETENTION_DAYS = 120

    /** 안전장치. 어떤 이유로든 기록이 폭증해도 이 개수를 넘기지 않는다. */
    private const val MAX_ENTRIES = 2000

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA)

    /**
     * 잠금이 어떻게 끝났는지. 웹의 LockEndReason 과 문자열이 일치해야 한다.
     *
     * 이 둘뿐이다. 앱에서 임의로 푸는 경로는 만들지 않았다.
     * 잠금을 푸는 길은 **지휘 미션 성공** 하나여야 제품이 성립한다.
     * (나중에 '비상 탈출구'를 넣게 되면 사유를 하나 추가할 것)
     */
    enum class EndReason(val value: String) {
        /** 설정한 시간을 끝까지 채움 */
        EXPIRED("expired"),
        /** 지휘 미션에 성공해 풀림 */
        MISSION_SUCCESS("mission_success")
    }

    data class Entry(
        val sessionId: String,
        val date: String,
        val startedAt: Long,
        val endedAt: Long,
        val heldMinutes: Int,
        val plannedMinutes: Int,
        val endReason: String,
        val blockedAppCount: Int,
        val launchAttempts: Int
    )

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /**
     * 끝난 잠금 하나를 기록한다.
     *
     * @param startedAt   잠금이 실제로 시작된 시각
     * @param plannedEndsAt 사용자가 설정했던 종료 시각(얼마나 채웠는지 비교용)
     */
    fun record(
        context: Context,
        sessionId: String,
        startedAt: Long,
        plannedEndsAt: Long,
        endReason: EndReason,
        blockedAppCount: Int,
        launchAttempts: Int
    ) {
        val endedAt = System.currentTimeMillis()

        // 시작 시각이 없거나 이상하면(예: 기존 세션이라 기록이 없음) 남기지 않는다.
        // 잘못된 값으로 리포트를 오염시키는 것보다 빠지는 편이 낫다.
        if (startedAt <= 0 || endedAt <= startedAt) {
            Log.w(TAG, "시작 시각이 유효하지 않아 기록하지 않음 (session=$sessionId)")
            return
        }

        val entry = Entry(
            sessionId = sessionId,
            date = dateFormat.format(Date(startedAt)),
            startedAt = startedAt,
            endedAt = endedAt,
            heldMinutes = ((endedAt - startedAt) / 60_000L).toInt(),
            plannedMinutes = if (plannedEndsAt > startedAt) {
                ((plannedEndsAt - startedAt) / 60_000L).toInt()
            } else 0,
            endReason = endReason.value,
            blockedAppCount = blockedAppCount,
            launchAttempts = launchAttempts
        )

        val list = readAll(context).toMutableList()
        list.add(entry)

        save(context, prune(list))
        Log.i(
            TAG,
            "잠금 기록 — ${entry.heldMinutes}분 유지 (계획 ${entry.plannedMinutes}분), 사유 ${entry.endReason}"
        )
    }

    /** 최근 [days] 일치 기록. 오래된 것부터 정렬해서 돌려준다. */
    fun getRecent(context: Context, days: Int): List<Entry> {
        val safeDays = days.coerceIn(1, RETENTION_DAYS)
        val cutoff = System.currentTimeMillis() - safeDays * DAY_MS

        return readAll(context)
            .filter { it.startedAt >= cutoff }
            .sortedBy { it.startedAt }
    }

    /** 기록을 모두 지운다. 앱의 '데이터 초기화'에서 쓴다. */
    fun clear(context: Context) {
        prefs(context).edit().clear().apply()
        Log.i(TAG, "잠금 기록 초기화됨")
    }

    // ─────────────────────────────────────────────
    // 내부
    // ─────────────────────────────────────────────

    /** 보관 기간이 지났거나 개수를 넘긴 기록을 잘라낸다. */
    private fun prune(list: List<Entry>): List<Entry> {
        val cutoff = System.currentTimeMillis() - RETENTION_DAYS * DAY_MS
        return list
            .filter { it.startedAt >= cutoff }
            .sortedBy { it.startedAt }
            .takeLast(MAX_ENTRIES)
    }

    private fun readAll(context: Context): List<Entry> {
        val raw = prefs(context).getString(KEY_ENTRIES, null) ?: return emptyList()

        return try {
            val array = JSONArray(raw)
            (0 until array.length()).mapNotNull { i ->
                val o = array.optJSONObject(i) ?: return@mapNotNull null
                Entry(
                    sessionId = o.optString("sessionId"),
                    date = o.optString("date"),
                    startedAt = o.optLong("startedAt"),
                    endedAt = o.optLong("endedAt"),
                    heldMinutes = o.optInt("heldMinutes"),
                    plannedMinutes = o.optInt("plannedMinutes"),
                    endReason = o.optString("endReason"),
                    blockedAppCount = o.optInt("blockedAppCount"),
                    launchAttempts = o.optInt("launchAttempts")
                )
            }
        } catch (e: Exception) {
            // 저장 형식이 깨졌다면 기록을 잃더라도 앱은 계속 돌아야 한다.
            Log.e(TAG, "기록을 읽지 못해 비운다", e)
            emptyList()
        }
    }

    private fun save(context: Context, list: List<Entry>) {
        val array = JSONArray()
        list.forEach { e ->
            array.put(
                JSONObject()
                    .put("sessionId", e.sessionId)
                    .put("date", e.date)
                    .put("startedAt", e.startedAt)
                    .put("endedAt", e.endedAt)
                    .put("heldMinutes", e.heldMinutes)
                    .put("plannedMinutes", e.plannedMinutes)
                    .put("endReason", e.endReason)
                    .put("blockedAppCount", e.blockedAppCount)
                    .put("launchAttempts", e.launchAttempts)
            )
        }
        prefs(context).edit().putString(KEY_ENTRIES, array.toString()).apply()
    }

    private const val DAY_MS = 24 * 60 * 60 * 1000L
}
