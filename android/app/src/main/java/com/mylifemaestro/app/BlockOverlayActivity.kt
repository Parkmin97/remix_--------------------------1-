package com.mylifemaestro.app

import android.annotation.SuppressLint
import android.app.Activity
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
    }

    private var webView: WebView? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val blockedPackage = intent?.getStringExtra(EXTRA_BLOCKED_PACKAGE) ?: "unknown"
        Log.i(TAG, "차단 화면 표시 — 대상: $blockedPackage")

        setupWindowFlags()
        setContentView(createWebView(blockedPackage))
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
    private fun createWebView(blockedPackage: String): WebView {
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

        // 웹 앱에 "차단 화면 모드로, 미션부터 시작"이라고 알린다.
        val url = "https://$ASSET_HOST/index.html?screen=mission&mode=block&pkg=$blockedPackage"
        Log.i(TAG, "로드: $url")
        view.loadUrl(url)

        webView = view
        return view
    }

    /**
     * 웹에서 미션 결과를 돌려받는 통로. 웹 쪽 `src/lib/blockBridge.ts` 와 짝이다.
     *
     * ⚠️ 자바스크립트에서 호출되므로 UI 스레드가 아니다. UI 조작은 runOnUiThread 로 감싼다.
     */
    private inner class MissionResultBridge {
        @JavascriptInterface
        fun onMissionResult(result: String) {
            Log.i(TAG, "미션 결과 수신: $result")

            runOnUiThread {
                when (result) {
                    "success" -> {
                        // TODO(Week 3): 여기서 N분 해제하고 원래 앱으로 복귀시킨다.
                        Log.i(TAG, "✅ 미션 성공 — 차단 화면 종료 (해제 로직은 Week 3)")
                        finish()
                    }
                    else -> {
                        // 실패·포기는 차단을 유지한 채 홈으로 보낸다.
                        Log.i(TAG, "미션 $result — 차단 유지")
                        finish()
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

    @Suppress("DEPRECATION", "MissingSuperCall")
    override fun onBackPressed() {
        Log.i(TAG, "뒤로가기 차단됨")
        // 아무것도 하지 않는다 = 빠져나갈 수 없다
    }

    override fun onDestroy() {
        webView?.destroy()
        webView = null
        super.onDestroy()
    }
}
