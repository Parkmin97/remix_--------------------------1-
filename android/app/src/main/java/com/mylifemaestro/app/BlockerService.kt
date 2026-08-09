package com.mylifemaestro.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageEvents
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log

/**
 * 차단 엔진의 심장. 백그라운드에서 계속 돌며 지금 어떤 앱이 켜져 있는지 감시한다.
 *
 * [스파이크 2026-08-07] Week 1 목표는 "유튜브를 켜면 검은 화면이 뜬다"까지만이다.
 * 해제 타이머·시간표·카테고리는 Week 3에서 붙인다.
 *
 * ■ 왜 포그라운드 서비스인가
 *   일반 서비스는 안드로이드가 언제든 죽인다. 포그라운드 서비스 + 상시 알림이어야
 *   그나마 오래 산다. 그래도 제조사(삼성)는 죽일 수 있어서 Week 2에서 3일 방치 검증을 한다.
 *
 * ■ 왜 접근성 서비스를 안 쓰는가
 *   구현은 훨씬 쉽지만 Google Play가 장애인 보조 목적으로만 허용한다.
 *   차단 용도로 쓰면 앱이 스토어에서 삭제된다.
 */
class BlockerService : Service() {

    companion object {
        private const val TAG = "BlockerService"

        private const val CHANNEL_ID = "blocker_service"
        private const val NOTIFICATION_ID = 1001

        /** 감지 주기. 짧을수록 빨리 막지만 배터리를 더 쓴다. Week 2에서 측정 후 조정. */
        private const val POLL_INTERVAL_MS = 800L

        /**
         * 같은 앱에 대해 차단 화면을 연속으로 띄우지 않기 위한 최소 간격.
         * 없으면 사용자가 차단 화면을 보는 동안에도 계속 새로 띄워 깜빡인다.
         */
        private const val REBLOCK_COOLDOWN_MS = 3000L

        fun start(context: Context) {
            val intent = Intent(context, BlockerService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }

    private val handler = Handler(Looper.getMainLooper())
    private lateinit var usageStatsManager: UsageStatsManager

    /** 마지막으로 차단 화면을 띄운 시각. 연속 표시를 막는 용도. */
    private var lastBlockAt = 0L

    /** 직전에 감지한 최상위 앱. 로그를 덜 시끄럽게 하려고 둔다. */
    private var lastForeground: String? = null

    private val pollTask = object : Runnable {
        override fun run() {
            checkForegroundApp()
            // 살아있다는 흔적을 남긴다. 내부적으로 1분에 한 번만 저장한다.
            SurvivalTracker.heartbeat(this@BlockerService)
            handler.postDelayed(this, POLL_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        createNotificationChannel()
        Log.i(TAG, "서비스 생성됨")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground(NOTIFICATION_ID, buildNotification())
        handler.removeCallbacks(pollTask)
        handler.post(pollTask)
        val status = BlockSessionStore.getStatus(this)
        Log.i(TAG, "감시 시작 — 주기 ${POLL_INTERVAL_MS}ms, 세션 ${if (status.hasSession) "있음(대상 ${status.blockedPackages.size}개)" else "없음"}")

        // Week 2 생존성 측정. 서비스가 며칠 뒤에 죽는지 추적한다.
        SurvivalTracker.onServiceStart(this)
        SurvivalTracker.logStatus(this)

        // 죽어도 시스템이 다시 살리도록 요청한다 (보장되지는 않는다)
        return START_STICKY
    }

    override fun onDestroy() {
        handler.removeCallbacks(pollTask)
        Log.i(TAG, "서비스 종료됨")
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    /**
     * 지금 화면에 떠 있는 앱을 알아낸다.
     *
     * UsageStatsManager 는 "최근 이벤트 목록"을 주므로, 최근 구간을 조회해
     * 가장 마지막 ACTIVITY_RESUMED 이벤트의 패키지를 현재 앱으로 본다.
     */
    private fun checkForegroundApp() {
        val now = System.currentTimeMillis()
        val events = usageStatsManager.queryEvents(now - 10_000, now)

        var foreground: String? = null
        val event = UsageEvents.Event()
        while (events.hasNextEvent()) {
            events.getNextEvent(event)
            val resumed = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                event.eventType == UsageEvents.Event.ACTIVITY_RESUMED
            } else {
                @Suppress("DEPRECATION")
                event.eventType == UsageEvents.Event.MOVE_TO_FOREGROUND
            }
            if (resumed) foreground = event.packageName
        }

        if (foreground == null) return

        if (foreground != lastForeground) {
            Log.i(TAG, "현재 앱: $foreground")
            lastForeground = foreground
        }

        // 차단 여부는 세션 상태가 결정한다. 잠금 시간이 끝났으면 자동으로 풀린다.
        if (BlockSessionStore.shouldBlock(this, foreground)) {
            if (now - lastBlockAt < REBLOCK_COOLDOWN_MS) return
            lastBlockAt = now
            BlockSessionStore.countLaunchAttempt(this)
            showBlockScreen(foreground)
        }
    }

    private fun showBlockScreen(blockedPackage: String) {
        Log.i(TAG, "🚫 차단 대상 감지: $blockedPackage → 차단 화면 표시")

        val intent = Intent(this, BlockOverlayActivity::class.java).apply {
            addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    Intent.FLAG_ACTIVITY_NO_ANIMATION
            )
            putExtra(BlockOverlayActivity.EXTRA_BLOCKED_PACKAGE, blockedPackage)
        }
        startActivity(intent)
    }

    // ─────────────────────────────────────────────
    // 상시 알림 (포그라운드 서비스 필수 요건)
    // ─────────────────────────────────────────────

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val channel = NotificationChannel(
            CHANNEL_ID,
            "차단 보호 실행 중",
            NotificationManager.IMPORTANCE_LOW // 소리·진동 없음
        ).apply {
            description = "앱 차단이 동작하려면 이 알림이 계속 떠 있어야 합니다"
            setShowBadge(false)
        }

        val manager = getSystemService(NotificationManager::class.java)
        manager?.createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        val openApp = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val pending = PendingIntent.getActivity(
            this, 0, openApp,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_ID)
        } else {
            @Suppress("DEPRECATION")
            Notification.Builder(this)
        }

        return builder
            .setContentTitle("내인생 지휘자")
            .setContentText("차단 보호가 켜져 있습니다")
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentIntent(pending)
            .setOngoing(true) // 사용자가 쓸어서 지울 수 없다
            .build()
    }
}
