package com.mylifemaestro.app

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView

/**
 * 차단 화면.
 *
 * [스파이크 2026-08-07] 지금은 검은 화면에 글자만 띄운다.
 * Week 5에서 이 안에 WebView 를 넣고 기존 React 지휘 미션을 로드할 예정이다.
 * 즉 이 액티비티는 **껍데기**이고, 내용물은 이미 만들어둔 웹 화면이 된다.
 *
 * 뒤로가기·홈으로 빠져나가지 못하게 막는 것이 핵심이다.
 * 빠져나갈 수 있으면 차단이 무의미하다.
 */
class BlockOverlayActivity : Activity() {

    companion object {
        private const val TAG = "BlockOverlay"

        /** 어떤 앱 때문에 차단됐는지 전달받는 키. */
        const val EXTRA_BLOCKED_PACKAGE = "blocked_package"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val blockedPackage = intent?.getStringExtra(EXTRA_BLOCKED_PACKAGE) ?: "(알 수 없음)"
        Log.i(TAG, "차단 화면 표시 — 대상: $blockedPackage")

        // 잠금 화면 위에도 뜨고, 꺼진 화면도 켜지도록
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

        setContentView(buildSpikeView(blockedPackage))
    }

    /** 스파이크용 임시 화면. Week 5에서 WebView 로 교체된다. */
    private fun buildSpikeView(blockedPackage: String): LinearLayout {
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            setBackgroundColor(Color.BLACK)
            setPadding(64, 64, 64, 64)
        }

        val title = TextView(this).apply {
            text = "잠시 멈춰볼까요"
            setTextColor(Color.WHITE)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 28f)
            gravity = Gravity.CENTER
        }

        val subtitle = TextView(this).apply {
            text = "차단됨: $blockedPackage\n\n[스파이크] 여기에 1분 지휘 미션이 들어갑니다"
            setTextColor(Color.parseColor("#AAAAAA"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            gravity = Gravity.CENTER
            setPadding(0, 48, 0, 0)
        }

        root.addView(title)
        root.addView(subtitle)
        return root
    }

    /**
     * 뒤로가기로 빠져나가지 못하게 막는다.
     *
     * ⚠️ 이 앱에는 웹뷰 쪽 뒤로가기 미처리 버그가 따로 있다(안드로이드 13·16 모두 재현).
     *    여기는 네이티브 액티비티라 별개이며, 차단 화면에서는 반드시 막아야 한다.
     */
    @Suppress("DEPRECATION", "MissingSuperCall")
    override fun onBackPressed() {
        Log.i(TAG, "뒤로가기 차단됨")
        // 아무것도 하지 않는다 = 빠져나갈 수 없다
    }

    /**
     * 홈 버튼으로 나갔다가 돌아오는 경우는 서비스가 다시 띄운다.
     * 여기서는 화면이 사라진 사실만 기록한다.
     */
    override fun onPause() {
        super.onPause()
        Log.i(TAG, "차단 화면이 가려짐 — 서비스가 재감지하면 다시 띄운다")
    }
}
