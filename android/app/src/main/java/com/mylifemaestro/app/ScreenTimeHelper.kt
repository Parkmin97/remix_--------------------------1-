package com.mylifemaestro.app

import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/**
 * 폰이 기록한 실제 스크린타임을 읽는다.
 *
 * ■ 우리가 직접 센 값과 무엇이 다른가
 *   앱 안에서 세는 방식은 우리 앱이 꺼져 있는 동안을 알 수 없다.
 *   여기서 가져오는 것은 **안드로이드가 시스템 차원에서 집계한 실제 사용 시간**이라
 *   훨씬 정확하다.
 *
 * ■ 권한
 *   차단 감지에 쓰는 "사용 정보 접근"(PACKAGE_USAGE_STATS) 을 그대로 쓴다.
 *   추가로 받을 권한이 없다.
 *
 * ■ 왜 queryUsageStats 대신 이벤트를 직접 세는가
 *   `queryUsageStats(INTERVAL_DAILY, ...)` 는 기기·제조사에 따라 집계 구간이
 *   요청한 날짜와 어긋나는 경우가 있다. 하루 경계를 우리가 정확히 맞추려면
 *   포그라운드 진입/이탈 이벤트를 직접 짝지어 재는 편이 안정적이다.
 */
object ScreenTimeHelper {

    private const val TAG = "ScreenTime"

    /** 이보다 짧은 사용은 버린다. 알림을 열었다 닫는 등 의미 없는 기록이 섞인다. */
    private const val MIN_SESSION_MS = 1_000L

    /**
     * 스크린타임에서 제외할 앱들.
     *
     * ⚠️ 실기기(A32)에서 확인한 실제 문제:
     *    - "재난문자" 182분  → 사용자가 쓴 게 아니라 시스템이 떠 있었던 것
     *    - "One UI 홈" 55분  → 홈 화면에 머문 시간. 앱 사용이 아니다
     *    이걸 안 거르면 리포트에 "어제 199분 썼습니다" 같은 엉뚱한 숫자가 나온다.
     *
     * 런처와 시스템 UI 는 "앱을 썼다"고 볼 수 없으므로 뺀다.
     */
    /**
     * 패키지명에 이 조각이 들어가면 제외한다.
     *
     * 제조사마다 패키지명이 달라서 정확한 이름을 다 알 수 없다.
     * (예: 재난문자가 A32에서는 `com.google.android.cellbroadcastreceiver` 인데
     *  기기에 따라 `com.samsung.android.cmas` 등으로 다르다)
     * 그래서 정확한 이름 목록 대신 **조각 매칭**으로 넓게 잡는다.
     */
    private val EXCLUDED_KEYWORDS = listOf(
        "launcher",         // One UI 홈 등 런처 — 홈 화면에 머문 시간
        "systemui",         // 상태바·알림창
        "cellbroadcast",    // 재난문자 (실측에서 182분으로 집계됐다)
        "emergency",        // 긴급 모드
        "telephonyui",      // 통신 관련 시스템 UI
        "com.android.settings",
        "inputmethod",      // 키보드
        "com.samsung.android.honeyboard"
    )

    /**
     * 스크린타임 집계에서 뺄 앱인가.
     *
     * ⚠️ 이 목록은 **"사용자가 실제로 쓴 시간"** 을 재기 위한 것이다.
     *    시스템이 백그라운드로 떠 있던 시간까지 더하면 리포트 숫자가 무의미해진다.
     */
    private fun isExcluded(pkg: String): Boolean {
        val lower = pkg.lowercase()
        return EXCLUDED_KEYWORDS.any { lower.contains(it) }
    }

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.KOREA)

    data class AppUsage(
        val packageName: String,
        val appName: String,
        val minutes: Int
    )

    data class DayUsage(
        /** yyyy-MM-dd (기기 로컬 시간 기준) */
        val date: String,
        val totalMinutes: Int,
        /** 많이 쓴 순 정렬 */
        val apps: List<AppUsage>
    )

    /**
     * 오늘부터 거슬러 [days] 일치의 하루별 사용 시간을 돌려준다.
     *
     * 반환 순서는 과거 → 오늘이다. 리포트가 주간 그래프를 왼쪽부터 그리기 때문이다.
     */
    fun getDailyUsage(context: Context, days: Int): List<DayUsage> {
        if (!PermissionHelper.hasUsageStatsPermission(context)) {
            Log.w(TAG, "사용 정보 접근 권한이 없어 스크린타임을 읽을 수 없다")
            return emptyList()
        }

        val usm = context.getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return emptyList()

        val safeDays = days.coerceIn(1, 90)
        val startOfToday = startOfDay(System.currentTimeMillis())
        val rangeStart = startOfToday - (safeDays - 1) * DAY_MS
        val now = System.currentTimeMillis()

        // 하루별 → 패키지별 사용 시간(ms)
        val perDay = HashMap<String, HashMap<String, Long>>()

        // 앱이 포그라운드로 올라온 시각을 기억해뒀다가, 내려갈 때 구간을 확정한다.
        val enteredAt = HashMap<String, Long>()

        val events = usm.queryEvents(rangeStart, now)
        val event = UsageEvents.Event()

        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val pkg = event.packageName ?: continue

            when (event.eventType) {
                UsageEvents.Event.ACTIVITY_RESUMED -> {
                    enteredAt[pkg] = event.timeStamp
                }

                UsageEvents.Event.ACTIVITY_PAUSED,
                UsageEvents.Event.ACTIVITY_STOPPED -> {
                    val start = enteredAt.remove(pkg) ?: continue
                    addUsage(perDay, pkg, start, event.timeStamp)
                }
            }
        }

        // 아직 화면에 떠 있는 앱은 지금까지를 사용 시간으로 친다.
        enteredAt.forEach { (pkg, start) -> addUsage(perDay, pkg, start, now) }

        return buildResult(context, perDay, rangeStart, safeDays)
    }

    /**
     * [start, end] 구간을 날짜별로 쪼개서 더한다.
     * 자정을 넘겨 쓴 경우(예: 23:50~00:20) 두 날에 나눠 담아야 하루 합계가 정확해진다.
     */
    private fun addUsage(
        perDay: HashMap<String, HashMap<String, Long>>,
        pkg: String,
        start: Long,
        end: Long
    ) {
        if (end <= start) return
        if (end - start < MIN_SESSION_MS) return

        var cursor = start
        while (cursor < end) {
            val dayEnd = startOfDay(cursor) + DAY_MS
            val sliceEnd = minOf(end, dayEnd)
            val key = dateFormat.format(cursor)

            val dayMap = perDay.getOrPut(key) { HashMap() }
            dayMap[pkg] = (dayMap[pkg] ?: 0L) + (sliceEnd - cursor)

            cursor = sliceEnd
        }
    }

    private fun buildResult(
        context: Context,
        perDay: HashMap<String, HashMap<String, Long>>,
        rangeStart: Long,
        days: Int
    ): List<DayUsage> {
        val pm = context.packageManager
        val myPackage = context.packageName
        val result = ArrayList<DayUsage>(days)

        for (i in 0 until days) {
            val dayKey = dateFormat.format(rangeStart + i * DAY_MS)
            val dayMap = perDay[dayKey] ?: HashMap()

            val apps = dayMap.entries
                .asSequence()
                // 우리 앱 사용 시간은 디톡스 통계에서 의미가 없으므로 뺀다
                .filter { it.key != myPackage }
                // 런처·시스템 앱은 "썼다"고 볼 수 없다 (위 EXCLUDED 주석 참고)
                .filter { !isExcluded(it.key) }
                .map { (pkg, ms) ->
                    AppUsage(
                        packageName = pkg,
                        appName = resolveAppName(pm, pkg),
                        minutes = (ms / 60_000L).toInt()
                    )
                }
                .filter { it.minutes > 0 }
                .sortedByDescending { it.minutes }
                .toList()

            result.add(
                DayUsage(
                    date = dayKey,
                    totalMinutes = apps.sumOf { it.minutes },
                    apps = apps
                )
            )
        }

        return result
    }

    /** 앱 이름을 얻는다. 지워진 앱이면 패키지명을 그대로 쓴다. */
    private fun resolveAppName(pm: PackageManager, pkg: String): String = try {
        pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString()
    } catch (e: PackageManager.NameNotFoundException) {
        pkg
    }

    private const val DAY_MS = 24 * 60 * 60 * 1000L

    private fun startOfDay(time: Long): Long = Calendar.getInstance().apply {
        timeInMillis = time
        set(Calendar.HOUR_OF_DAY, 0)
        set(Calendar.MINUTE, 0)
        set(Calendar.SECOND, 0)
        set(Calendar.MILLISECOND, 0)
    }.timeInMillis

    /** 스파이크 검증용. 최근 며칠치를 로그로 찍는다. */
    fun logRecentUsage(context: Context, days: Int = 3) {
        val result = getDailyUsage(context, days)
        Log.i(TAG, "===== 스크린타임 최근 ${days}일 =====")
        result.forEach { day ->
            Log.i(TAG, "${day.date} — 총 ${day.totalMinutes}분")
            day.apps.take(5).forEach { app ->
                Log.i(TAG, "    ${app.minutes}분  ${app.appName}")
            }
        }
        Log.i(TAG, "==============================")
    }
}
