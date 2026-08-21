package com.mylifemaestro.app

import android.content.Context
import android.util.Log

/**
 * 잠금 세션의 **단일 소유자**. 차단 여부를 판단하는 모든 근거가 여기 있다.
 *
 * ■ 왜 네이티브가 소유하는가
 *   감시 서비스는 앱이 꺼져 있어도 돌아간다. 웹의 localStorage 는 읽을 수 없다.
 *   게다가 차단 화면 웹뷰는 메인 앱과 origin 이 달라 저장소가 아예 분리된다(8/9 확인).
 *   그래서 세션 정보는 네이티브가 갖고, 웹은 브리지로 읽고 쓴다.
 *
 * ■ 사용자 플로우
 *   ① 앱에서 잠금 설정 (모드 A: 즉시 N분 / 모드 B: M분 사용 후 N분)
 *   ② 잠금 기간 동안 잠근 앱 실행 시도
 *   ③ 차단 화면에서 "미션으로 풀기" 또는 "잠금 유지" 선택
 *   ④ 미션 성공 → 세션 완전 종료 / 실패 → 설정 시간까지 유지, 재도전 불가
 */
object BlockSessionStore {

    private const val TAG = "BlockSession"
    private const val PREFS = "block_session"

    private const val KEY_SESSION_ID = "session_id"
    /** 잠금이 실제로 시작된 시각. '지켜낸 시간'을 재려면 반드시 필요하다. */
    private const val KEY_STARTED_AT = "started_at"
    private const val KEY_LOCK_ENDS_AT = "lock_ends_at"
    private const val KEY_USAGE_ENDS_AT = "usage_ends_at"
    private const val KEY_BLOCKED_PACKAGES = "blocked_packages"
    /** 통째로 잠근 카테고리. 잠금 중 새로 깐 앱도 여기 속하면 막는다. */
    private const val KEY_BLOCKED_CATEGORIES = "blocked_categories"
    /** 패키지 → 카테고리 대응표. "패키지=카테고리" 형태의 문자열 집합으로 둔다. */
    private const val KEY_PACKAGE_CATEGORIES = "package_categories"
    private const val KEY_MISSION_ATTEMPTED = "mission_attempted"
    private const val KEY_LAUNCH_ATTEMPTS = "launch_attempts"

    private fun prefs(context: Context) =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    /** 차단 판단에 필요한 현재 상태 묶음. */
    data class Status(
        val hasSession: Boolean,
        /** 지금 이 순간 차단이 걸려 있는지 (모드 B 사용 시간 중이면 false). */
        val isLocked: Boolean,
        val lockEndsAt: Long,
        val usageEndsAt: Long,
        val blockedPackages: Set<String>,
        /** 통째로 잠근 카테고리. 여기 속하면 새로 깐 앱도 막는다. */
        val blockedCategories: Set<String>,
        /** 패키지 → 카테고리. 잠근 카테고리에 속한 앱만 들어 있다. */
        val packageCategories: Map<String, String>,
        /** 이번 세션에서 미션을 이미 시도했는지. 했으면 다시 못 한다. */
        val missionAttempted: Boolean,
        val launchAttempts: Int
    )

    // ─────────────────────────────────────────────
    // 세션 시작 / 종료
    // ─────────────────────────────────────────────

    /**
     * 잠금 세션을 시작한다.
     *
     * @param lockEndsAt   잠금이 끝나는 시각(epoch millis)
     * @param usageEndsAt  모드 B에서 "먼저 쓰기로 한" 시간의 종료 시각.
     *                     이 시각 전까지는 차단하지 않는다. 모드 A면 0.
     */
    fun startSession(
        context: Context,
        sessionId: String,
        lockEndsAt: Long,
        usageEndsAt: Long,
        blockedPackages: Set<String>,
        blockedCategories: Set<String> = emptySet(),
        packageCategories: Map<String, String> = emptyMap()
    ) {
        prefs(context).edit()
            .putString(KEY_SESSION_ID, sessionId)
            .putLong(KEY_STARTED_AT, System.currentTimeMillis())
            .putLong(KEY_LOCK_ENDS_AT, lockEndsAt)
            .putLong(KEY_USAGE_ENDS_AT, usageEndsAt)
            .putStringSet(KEY_BLOCKED_PACKAGES, blockedPackages)
            .putStringSet(KEY_BLOCKED_CATEGORIES, blockedCategories)
            .putStringSet(
                KEY_PACKAGE_CATEGORIES,
                packageCategories.map { (pkg, cat) -> "$pkg=$cat" }.toSet()
            )
            .putBoolean(KEY_MISSION_ATTEMPTED, false)
            .putInt(KEY_LAUNCH_ATTEMPTS, 0)
            .apply()

        Log.i(
            TAG,
            "세션 시작 — 앱 ${blockedPackages.size}개, 카테고리 ${blockedCategories.size}개" +
                "(대응표 ${packageCategories.size}건), 잠금 종료 $lockEndsAt, 사용 종료 $usageEndsAt"
        )
    }

    /**
     * 세션을 완전히 끝낸다.
     *
     * 사용자 플로우상 미션 성공은 "N분 해제"가 아니라 **잠금 자체의 종료**다.
     *
     * ⚠️ 지우기 전에 **실제 유지 시간을 이력에 남긴다.**
     *    리포트의 '지켜낸 시간'이 이 기록에서 나온다.
     *    설정한 시간이 아니라 실제로 버틴 시간이어야 하기 때문이다.
     */
    fun endSession(context: Context, reason: String, endReason: LockHistoryStore.EndReason) {
        val p = prefs(context)
        val sessionId = p.getString(KEY_SESSION_ID, null)

        if (sessionId != null) {
            LockHistoryStore.record(
                context = context,
                sessionId = sessionId,
                startedAt = p.getLong(KEY_STARTED_AT, 0L),
                plannedEndsAt = p.getLong(KEY_LOCK_ENDS_AT, 0L),
                endReason = endReason,
                blockedAppCount = (p.getStringSet(KEY_BLOCKED_PACKAGES, emptySet()) ?: emptySet()).size,
                launchAttempts = p.getInt(KEY_LAUNCH_ATTEMPTS, 0)
            )
        }

        p.edit().clear().apply()
        Log.i(TAG, "세션 종료 — 사유: $reason")
    }

    /** 미션을 시도했음을 기록한다. 실패해도 이번 세션에서는 다시 못 한다. */
    fun markMissionAttempted(context: Context) {
        prefs(context).edit().putBoolean(KEY_MISSION_ATTEMPTED, true).apply()
        Log.i(TAG, "미션 시도 기록됨 — 이번 세션에서 재도전 불가")
    }

    /** 잠근 앱을 열려고 한 횟수를 센다. 리포트에서 "몇 번 유혹을 느꼈는지"로 쓰인다. */
    fun countLaunchAttempt(context: Context) {
        val p = prefs(context)
        p.edit().putInt(KEY_LAUNCH_ATTEMPTS, p.getInt(KEY_LAUNCH_ATTEMPTS, 0) + 1).apply()
    }

    // ─────────────────────────────────────────────
    // 조회
    // ─────────────────────────────────────────────

    fun getStatus(context: Context): Status {
        val p = prefs(context)
        val sessionId = p.getString(KEY_SESSION_ID, null)
        val lockEndsAt = p.getLong(KEY_LOCK_ENDS_AT, 0L)
        val usageEndsAt = p.getLong(KEY_USAGE_ENDS_AT, 0L)
        val now = System.currentTimeMillis()

        // 모드 B에서 "먼저 쓰기로 한" 시간 중에는 차단하지 않는다.
        val inUsageWindow = usageEndsAt > 0 && now < usageEndsAt
        val locked = sessionId != null && now < lockEndsAt && !inUsageWindow

        return Status(
            hasSession = sessionId != null,
            isLocked = locked,
            lockEndsAt = lockEndsAt,
            usageEndsAt = usageEndsAt,
            blockedPackages = p.getStringSet(KEY_BLOCKED_PACKAGES, emptySet()) ?: emptySet(),
            blockedCategories = p.getStringSet(KEY_BLOCKED_CATEGORIES, emptySet()) ?: emptySet(),
            packageCategories = (p.getStringSet(KEY_PACKAGE_CATEGORIES, emptySet()) ?: emptySet())
                .mapNotNull { entry ->
                    val i = entry.lastIndexOf('=')
                    if (i <= 0) null else entry.substring(0, i) to entry.substring(i + 1)
                }
                .toMap(),
            missionAttempted = p.getBoolean(KEY_MISSION_ATTEMPTED, false),
            launchAttempts = p.getInt(KEY_LAUNCH_ATTEMPTS, 0)
        )
    }

    /**
     * 잠금 시간이 다 됐으면 세션을 정리한다.
     *
     * ⚠️ **감시 루프에서 매번, 앱 감지와 무관하게 호출해야 한다.**
     *    앱 감지 결과에 딸려 있으면 화면이 꺼져 있을 때 만료가 처리되지 않아
     *    잠금이 영영 풀리지 않는다. (8/9 실기기에서 확인된 문제)
     *
     * @param onExpired 실제로 만료 처리가 일어났을 때 호출된다. 사용자 알림용.
     * @return 만료 처리를 했으면 true
     */
    fun expireIfDue(context: Context, onExpired: (() -> Unit)? = null): Boolean {
        val p = prefs(context)
        val sessionId = p.getString(KEY_SESSION_ID, null) ?: return false
        val lockEndsAt = p.getLong(KEY_LOCK_ENDS_AT, 0L)

        if (System.currentTimeMillis() < lockEndsAt) return false

        endSession(context, "잠금 시간 종료", LockHistoryStore.EndReason.EXPIRED)
        onExpired?.invoke()
        return true
    }

    /**
     * 이 앱을 지금 막아야 하는가. 감시 서비스가 매 주기마다 묻는다.
     *
     * 두 가지 경우에 막는다.
     *  1. 사용자가 직접 고른 앱
     *  2. **통째로 잠근 카테고리에 속한 앱** — 잠금 중에 새로 설치한 것도 포함된다.
     *     "숏폼을 막겠다"고 걸어놓고 잠금 도중 새 숏폼 앱을 깔아 빠져나가는 길을 막는다.
     */
    fun shouldBlock(context: Context, packageName: String): Boolean {
        val status = getStatus(context)
        if (!status.isLocked) return false
        return isTarget(status, packageName)
    }

    /**
     * 이 앱이 이번 세션의 **잠금 대상**인가. 시간은 보지 않는다.
     *
     * [shouldBlock] 은 "지금 막아야 하는가"(대상 + 잠금 시간 중)를 묻고,
     * 이쪽은 "대상이기는 한가"만 묻는다. 둘을 나눈 이유는 모드 B의 사용 시간 때문이다.
     * 그 구간에서는 막지 않지만, 사용자가 대상 앱을 쓰고 있다는 사실은 알아야 한다
     * — 남은 시간을 그 위에 띄워줘야 하기 때문이다 (UsageOverlay).
     */
    fun isTarget(status: Status, packageName: String): Boolean {
        if (!status.hasSession) return false

        if (packageName in status.blockedPackages) return true

        // 카테고리 잠금 — 세션 시작 당시엔 없던 앱도 여기서 걸린다.
        if (status.blockedCategories.isEmpty()) return false
        val category = status.packageCategories[packageName] ?: return false
        return category in status.blockedCategories
    }

    /** 차단 화면에서 "미션으로 풀기" 버튼을 보여줄지. 이미 시도했으면 숨긴다. */
    fun canAttemptMission(context: Context): Boolean = !getStatus(context).missionAttempted
}
