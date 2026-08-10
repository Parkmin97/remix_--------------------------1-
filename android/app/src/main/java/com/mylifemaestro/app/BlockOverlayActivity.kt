package com.mylifemaestro.app

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.webkit.WebViewClient
import android.view.WindowManager
import androidx.webkit.WebViewAssetLoader

/**
 * 차단 화면.
 *
 * 껍데기만 네이티브고, 안에는 **이미 만들어둔 React 지휘 미션이 그대로** 들어간다.
 * 지휘 미션을 다시 만들 필요가 없다는 것이 Capacitor 를 쓴 가장 큰 이득이다.
 *
 * ■ 왜 file:// 이 아니라 https 로 로드하는가
 *   빌드된 index.html 이 `<script type="module">` 을 쓰는데,
 *   file:// 에서는 CORS 정책상 ES 모듈 로드가 차단된다.
 *   그래서 WebViewAssetLoader 로 앱 내부 파일을 가상 https 주소로 서빙한다.
 *
 * ■ 뒤로가기·홈 우회
 *   뒤로가기는 여기서 막는다. 홈으로 나가는 것은 막을 수 없지만,
 *   감시 서비스가 타깃 앱을 다시 감지하면 이 화면을 다시 띄운다.
 */
class BlockOverlayActivity : Activity() {

    companion object {
        private const val TAG = "BlockOverlay"

        const val EXTRA_BLOCKED_PACKAGE = "blocked_package"

        /** 앱 내부 파일을 서빙할 가상 도메인. 실제로 외부 통신을 하지 않는다. */
        private const val ASSET_HOST = "appassets.androidplatform.net"

        /**
         * 차단 화면이 지금 화면에 떠 있는지.
         *
         * [BlockerService] 가 "다시 띄워야 하는지"를 판단하는 근거다.
         * 예전에는 시간(3초)만 보고 판단했는데, 그러면 차단 화면이 뒤로 밀려
         * 잠근 앱이 다시 보이는 동안에도 3초를 꼬박 기다렸다.
         * 사용자에게는 앱이 보였다 안 보였다 깜빡이는 것으로 나타났다.
         *
         * 서비스와 같은 프로세스에서 돌기 때문에 이 값을 그대로 읽을 수 있다.
         */
        @Volatile
        var isShowing: Boolean = false
            private set
    }

    private var webView: WebView? = null

    /** 지금 웹뷰에 실제로 올라가 있는 내용. 같은 내용이면 다시 읽지 않는다. */
    private var loadedPackage: String? = null
    private var loadedMissionAttempted: Boolean = false

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setupWindowFlags()
        setContentView(createWebView())
        loadContentIfNeeded()
    }

    /**
     * 이미 살아 있는 차단 화면을 다시 띄우는 경우.
     *
     * launchMode=singleTask 라 새로 만들지 않고 이 화면을 앞으로 가져온다.
     * 이때 getIntent() 는 처음 만들 때의 인텐트를 그대로 돌려주므로
     * 새 인텐트로 갈아끼워야 어떤 앱을 막는 중인지 최신값이 된다.
     */
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        loadContentIfNeeded()
    }

    /**
     * 필요한 경우에만 웹 화면을 다시 읽는다.
     *
     * ⚠️ 여기서 매번 다시 읽으면 화면이 뜨는 속도가 느려진다.
     *    웹뷰를 새로 부팅하는 데 드는 시간이 곧 **잠근 앱이 화면에 보이는 시간**이다.
     *    막는 앱도 그대로고 미션 시도 여부도 그대로면 이미 그려진 화면을 그냥 쓴다.
     */
    private fun loadContentIfNeeded() {
        val blockedPackage = intent?.getStringExtra(EXTRA_BLOCKED_PACKAGE) ?: "unknown"
        val missionAttempted = BlockSessionStore.getStatus(this).missionAttempted

        if (blockedPackage == loadedPackage && missionAttempted == loadedMissionAttempted) {
            Log.i(TAG, "차단 화면 재사용 — 대상: $blockedPackage")
            return
        }

        loadedPackage = blockedPackage
        loadedMissionAttempted = missionAttempted

        // 차단 화면은 선택지부터 보여준다. 미션은 사용자가 "잠금 풀기"를 골랐을 때 시작된다.
        val url = "https://$ASSET_HOST/index.html?screen=block-choice&mode=block&pkg=$blockedPackage"
        Log.i(TAG, "차단 화면 표시 — 대상: $blockedPackage, 로드: $url")
        webView?.loadUrl(url)
    }

    private fun setupWindowFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            @Suppress("DEPRECATION")
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun createWebView(): WebView {
        // 앱의 assets/public/ 을 웹 루트로 서빙한다.
        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain(ASSET_HOST)
            .addPathHandler("/", PublicAssetHandler(this))
            .build()

        val view = WebView(this).apply {
            setBackgroundColor(Color.BLACK)

            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                // 지휘 미션은 소리가 핵심이다. 사용자 터치 없이도 재생돼야 한다.
                mediaPlaybackRequiresUserGesture = false
            }

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

                override fun onPageFinished(view: WebView?, url: String?) {
                    Log.i(TAG, "미션 화면 로드 완료")
                }
            }

            addJavascriptInterface(MissionResultBridge(), "BlockBridge")
        }

        // 실제 내용은 loadContentIfNeeded() 가 채운다.
        // 여기서 바로 읽지 않는 이유는 화면을 다시 띄울 때와 경로를 하나로 두기 위해서다.
        webView = view
        return view
    }

    /**
     * 웹에서 미션 결과를 돌려받는 통로. 웹 쪽 `src/lib/blockBridge.ts` 와 짝이다.
     *
     * ⚠️ 자바스크립트에서 호출되므로 UI 스레드가 아니다. UI 조작은 runOnUiThread 로 감싼다.
     */
    private inner class MissionResultBridge {

        /**
         * 차단 화면이 판단에 필요한 정보를 JSON 으로 돌려준다.
         *
         * 특히 `missionAttempted` 가 중요하다. 이미 미션을 시도했다면
         * "잠금 풀기" 선택지를 보여주면 안 된다. 우리 플로우상 재도전이 없기 때문이다.
         */
        @JavascriptInterface
        fun getBlockInfo(): String {
            val status = BlockSessionStore.getStatus(this@BlockOverlayActivity)
            val pkg = intent?.getStringExtra(EXTRA_BLOCKED_PACKAGE) ?: ""
            return """
                {"blockedPackage":"$pkg",
                 "missionAttempted":${status.missionAttempted},
                 "lockEndsAt":${status.lockEndsAt},
                 "launchAttempts":${status.launchAttempts}}
            """.trimIndent().replace("\n", "")
        }

        @JavascriptInterface
        fun onMissionResult(result: String) {
            Log.i(TAG, "미션 결과 수신: $result")

            runOnUiThread {
                when (result) {
                    "success" -> {
                        // 우리 플로우에서 미션 성공은 "N분 해제"가 아니라 잠금 자체의 종료다.
                        BlockSessionStore.endSession(
                            this@BlockOverlayActivity,
                            "미션 성공",
                            LockHistoryStore.EndReason.MISSION_SUCCESS
                        )
                        Log.i(TAG, "✅ 미션 성공 — 잠금 완전 해제")
                        returnToBlockedApp()
                    }
                    "fail" -> {
                        // 실패하면 설정 시간이 끝날 때까지 잠금이 유지되고, 재도전도 불가능하다.
                        BlockSessionStore.markMissionAttempted(this@BlockOverlayActivity)
                        Log.i(TAG, "미션 실패 — 설정 시간까지 잠금 유지, 재도전 불가")
                        goHome()
                    }
                    "keep" -> {
                        // 사용자가 "잠금 유지하기"를 고른 경우. 미션을 시작조차 하지 않았다.
                        Log.i(TAG, "잠금 유지 선택 — 재도전 가능")
                        goHome()
                    }
                    else -> {
                        // 사용자가 미션을 포기한 경우. 시도로 치지 않으므로 나중에 다시 할 수 있다.
                        Log.i(TAG, "미션 취소 — 잠금 유지 (재도전 가능)")
                        goHome()
                    }
                }
            }
        }
    }

    /** assets/public/ 아래를 웹 루트처럼 보이게 하는 핸들러. */
    private class PublicAssetHandler(activity: Activity) : WebViewAssetLoader.PathHandler {
        private val inner = WebViewAssetLoader.AssetsPathHandler(activity)

        override fun handle(path: String): WebResourceResponse? =
            inner.handle("public/$path")
    }

    /** 미션 성공 후 원래 열려던 앱으로 돌려보낸다. */
    private fun returnToBlockedApp() {
        val pkg = intent?.getStringExtra(EXTRA_BLOCKED_PACKAGE)
        val launch = pkg?.let { packageManager.getLaunchIntentForPackage(it) }

        if (launch != null) {
            Log.i(TAG, "원래 앱으로 복귀: $pkg")
            startActivity(launch)
        } else {
            Log.w(TAG, "원래 앱을 열 수 없어 홈으로 보냄")
            goHome()
        }
        finish()
    }

    /**
     * 잠금을 유지한 채 홈 화면으로 보낸다.
     *
     * ⚠️ finish() 하지 않는다.
     *    화면을 없애면 웹뷰도 함께 사라져, 다음에 잠근 앱을 열 때 웹뷰를 처음부터
     *    다시 부팅해야 한다. 그 부팅 시간이 곧 **잠근 앱이 눈에 보이는 시간**이다.
     *    홈으로 보내면 이 화면은 자연히 뒤로 물러나므로, 살려둔 채 다음 차단을 기다린다.
     *    (singleTask 라 다음 차단 때 이 화면이 그대로 앞으로 나온다)
     */
    private fun goHome() {
        val home = android.content.Intent(android.content.Intent.ACTION_MAIN).apply {
            addCategory(android.content.Intent.CATEGORY_HOME)
            flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK
        }
        startActivity(home)
    }

    @Suppress("DEPRECATION", "MissingSuperCall")
    override fun onBackPressed() {
        Log.i(TAG, "뒤로가기 차단됨")
        // 아무것도 하지 않는다 = 빠져나갈 수 없다
    }

    /*
     * 화면에 떠 있는 동안만 isShowing 을 true 로 둔다.
     *
     * onStart/onStop 을 쓰는 이유: 다른 앱이 위로 올라와 우리 화면이 가려지는 순간
     * onStop 이 불린다. 그때 서비스가 곧바로 다시 띄워야 잠근 앱이 노출되지 않는다.
     * onResume/onPause 는 반투명 창 같은 경우에도 불려서 실제로 가려지지 않았는데도
     * 다시 띄우게 될 수 있다.
     */
    override fun onStart() {
        super.onStart()
        isShowing = true
    }

    override fun onStop() {
        isShowing = false
        super.onStop()
    }

    override fun onDestroy() {
        // onStop 없이 파괴되는 경로가 있어도 깃발이 남지 않게 한 번 더 내린다.
        isShowing = false
        webView?.destroy()
        webView = null
        super.onDestroy()
    }
}
