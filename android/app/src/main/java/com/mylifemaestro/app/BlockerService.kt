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

        /**
         * 잠금 종료 알림용. 상시 알림과 분리해야 사용자가 이것만 따로 끌 수 있다.
         *
         * ⚠️ 채널 ID 끝에 `_v2` 가 붙은 이유:
         *    안드로이드는 **한 번 만든 채널의 중요도를 앱이 바꿀 수 없다.**
         *    사용자 설정을 앱이 몰래 되돌리지 못하게 하려는 정책이다.
         *    기존 채널이 "기본(소리만)"으로 이미 만들어져 있어서,
         *    화면 상단에 뜨는 헤드업 알림으로 올리려면 새 ID 로 채널을 다시 만들어야 했다.
         *    앞으로도 중요도를 바꾸려면 ID 를 올려야 한다.
         */
        private const val CHANNEL_DONE = "blocker_done_v2"
        private const val NOTIFICATION_DONE_ID = 1002

        /** 모드 B에서 사용 시간이 끝나 잠금으로 넘어갈 때 쓴다. */
        private const val NOTIFICATION_LOCK_STARTED_ID = 1003

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

    /**
     * 직전 주기의 잠금 여부. 모드 B에서 "사용 시간 → 잠금" 전환을 잡아내는 데 쓴다.
     * null 이면 아직 한 번도 확인하지 않은 상태다.
     */
    private var wasLocked: Boolean? = null

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

        // ⚠️ 만료 처리를 앱 감지보다 먼저, 그리고 독립적으로 한다.
        //    예전에는 아래 "포그라운드 앱을 찾은 경우"에만 만료를 확인했는데,
        //    화면이 꺼져 있거나 앱 전환이 없으면 감지 결과가 비어 early return 되면서
        //    **잠금이 영영 풀리지 않는** 문제가 있었다. (8/9 실기기에서 확인)
        BlockSessionStore.expireIfDue(this, ::notifyLockFinished)

        // 모드 B: "먼저 쓰기로 한 시간"이 끝나 잠금으로 넘어가는 순간을 잡는다.
        // 사용자가 SNS를 보는 도중에 일어나는 전환이라 예고 없이 막히면 고장으로 오해한다.
        val nowLocked = BlockSessionStore.getStatus(this).isLocked
        if (wasLocked == false && nowLocked) {
            notifyLockStarted()
        }
        wasLocked = nowLocked

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

    /**
     * 화면 상단에 떠오르는(헤드업) 알림을 띄운다.
     *
     * ⚠️ 상단에 떠 있는 시간(약 5초)은 **안드로이드가 정하며 앱이 늘릴 수 없다.**
     *    늘리려면 전체화면 인텐트를 써야 하는데, 그건 전화·알람 전용이라
     *    디톡스 앱이 쓰면 심사에서 문제가 된다. 쓰지 않는다.
     *    대신 알림창에는 사용자가 지울 때까지 남는다.
     */
    private fun notifyHeadsUp(id: Int, title: String, text: String) {
        Log.i(TAG, "알림: $title")

        val openApp = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        val pending = PendingIntent.getActivity(
            this, id, openApp,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, CHANNEL_DONE)
        } else {
            // 안드로이드 7 이하는 채널이 없어 알림 자체에 우선순위를 준다.
            @Suppress("DEPRECATION")
            Notification.Builder(this).setPriority(Notification.PRIORITY_HIGH)
        }

        val notification = builder
            .setContentTitle(title)
            .setContentText(text)
            // 긴 문구도 알림창에서 잘리지 않고 다 보이게 한다.
            .setStyle(Notification.BigTextStyle().bigText(text))
            .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
            .setContentIntent(pending)
            .setAutoCancel(true)
            // 헤드업으로 뜨려면 소리·진동 같은 "알릴 거리"가 있어야 한다.
            .setDefaults(Notification.DEFAULT_ALL)
            .build()

        getSystemService(NotificationManager::class.java)?.notify(id, notification)
    }

    /**
     * 잠금 시간이 끝났음을 알린다.
     *
     * 이게 없으면 잠금이 조용히 풀린다. 사용자는 언제 끝났는지 모르고,
     * "아직 잠겨 있나?" 하고 앱을 열어봐야 한다.
     */
    private fun notifyLockFinished() {
        notifyHeadsUp(
            NOTIFICATION_DONE_ID,
            "잠금이 끝났습니다",
            "수고하셨어요. 이제 잠갔던 앱을 다시 쓸 수 있습니다."
        )
    }

    /**
     * 모드 B에서 "먼저 쓰기로 한 시간"이 끝나 잠금이 시작됐음을 알린다.
     *
     * 이 전환은 사용자가 SNS를 보고 있는 도중에 일어난다.
     * 예고 없이 갑자기 막히면 고장으로 오해하므로 반드시 알려야 한다.
     */
    private fun notifyLockStarted() {
        notifyHeadsUp(
            NOTIFICATION_LOCK_STARTED_ID,
            "이제 잠금이 시작됩니다",
            "약속한 사용 시간이 끝났습니다. 지금부터 선택한 앱이 잠깁니다."
        )
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

        // 잠금 종료 알림은 별도 채널로 둔다.
        // 상시 알림(끌 수 없음)과 성격이 달라서, 사용자가 이것만 끌 수 있어야 한다.
        //
        // IMPORTANCE_HIGH 여야 화면 상단에 잠깐 떠오르는 헤드업 알림이 된다.
        // 잠금이 끝난 것은 사용자가 기다리던 소식이라 알림창을 열어봐야만 알 수 있으면 안 된다.
        val doneChannel = NotificationChannel(
            CHANNEL_DONE,
            "잠금 종료 알림",
            NotificationManager.IMPORTANCE_HIGH
        ).apply {
            description = "설정한 잠금 시간이 끝났을 때 화면 상단에 알려줍니다"
            enableVibration(true)
        }

        val manager = getSystemService(NotificationManager::class.java)
        manager?.createNotificationChannel(channel)
        manager?.createNotificationChannel(doneChannel)
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
