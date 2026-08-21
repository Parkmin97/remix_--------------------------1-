package com.mylifemaestro.app

import android.content.Context
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.util.Log
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView

/**
 * 예약 잠금 모드에서 "앱을 쓸 수 있는 남은 시간"을 다른 앱 위에 띄우는 작은 띠.
 *
 * ■ 왜 앱 밖에 띄우는가
 *   남은 시간이 필요한 순간은 **인스타를 보고 있는 순간**이다.
 *   우리 앱 안에서만 보여주면, 정작 시간이 녹는 동안에는 아무것도 보이지 않는다.
 *   그러다 예고 없이 차단 화면을 만나면 사용자는 그것을 고장으로 받아들인다.
 *
 * ■ 언제 뜨는가
 *   ① 예약 잠금 세션이 있고
 *   ② 아직 사용 시간이 남아 있고 (usageEndsAt 이전)
 *   ③ 지금 화면에 떠 있는 앱이 잠글 대상으로 고른 앱일 때
 *   이 셋이 모두 참일 때만. 다른 앱을 쓸 때는 방해할 이유가 없다.
 *
 * ■ 왜 터치를 안 받는가
 *   FLAG_NOT_TOUCHABLE 로 둔다. 남의 앱 위에 떠 있는 창이 터치를 먹으면
 *   그 자리의 버튼이 안 눌린다. 알려주기만 하고 길은 막지 않는다.
 *
 * ⚠️ 오버레이 권한(SYSTEM_ALERT_WINDOW)이 필요하다.
 *    차단 화면이 이미 같은 권한을 쓰므로 새로 요구하는 권한은 없다.
 *    권한이 없으면 조용히 넘어간다 — 이것 때문에 차단 자체가 멈추면 안 된다.
 */
object UsageOverlay {

    private const val TAG = "UsageOverlay"

    private var windowManager: WindowManager? = null
    private var root: View? = null
    private var label: TextView? = null

    /** 마지막으로 그린 문구. 같은 값을 다시 그리지 않으려고 들고 있는다. */
    private var lastText: String? = null

    /**
     * 남은 시간을 띄운다. 이미 떠 있으면 글자만 갈아 끼운다.
     *
     * @param remainingMs 사용 가능 시간이 끝나기까지 남은 밀리초
     */
    fun show(context: Context, remainingMs: Long) {
        if (!PermissionHelper.hasOverlayPermission(context)) return

        val text = "잠금까지 ${formatRemaining(remainingMs)}"

        if (root != null) {
            // 이미 떠 있다 — 글자만 바꾼다. 창을 다시 만들면 깜빡인다.
            if (text != lastText) {
                label?.text = text
                lastText = text
            }
            return
        }

        runCatching {
            val wm = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
            val view = buildView(context, text)

            wm.addView(view, buildLayoutParams(context))

            windowManager = wm
            root = view
            lastText = text
            Log.i(TAG, "사용 시간 표시 시작 — $text")
        }.onFailure {
            Log.w(TAG, "오버레이를 띄우지 못했다", it)
            windowManager = null
            root = null
            label = null
            lastText = null
        }
    }

    /** 띠를 내린다. 떠 있지 않으면 아무 일도 하지 않는다. */
    fun hide() {
        val wm = windowManager
        val view = root
        if (wm == null || view == null) return

        runCatching { wm.removeView(view) }
            .onFailure { Log.w(TAG, "오버레이를 내리지 못했다", it) }

        windowManager = null
        root = null
        label = null
        lastText = null
    }

    // ─────────────────────────────────────────────
    // 내부
    // ─────────────────────────────────────────────

    /**
     * 남은 시간을 `MM:SS` 로 적는다 (한 시간이 넘으면 `H:MM:SS`).
     *
     * 웹의 formatRemaining(src/lib/countdown.ts)과 같은 모양이어야 한다.
     * 앱 안과 앱 밖에서 같은 순간에 다른 숫자가 보이면 사용자는 둘 다 못 믿는다.
     */
    private fun formatRemaining(ms: Long): String {
        val total = if (ms <= 0) 0L else (ms + 999) / 1000 // 올림 — 웹과 동일
        val hours = total / 3600
        val mins = (total % 3600) / 60
        val secs = total % 60

        return if (hours > 0) {
            String.format("%d:%02d:%02d", hours, mins, secs)
        } else {
            String.format("%02d:%02d", mins, secs)
        }
    }

    private fun dp(context: Context, value: Float): Int =
        TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, value, context.resources.displayMetrics
        ).toInt()

    private fun buildView(context: Context, text: String): View {
        val pill = TextView(context).apply {
            this.text = text
            setTextColor(Color.BLACK)
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(dp(context, 14f), dp(context, 7f), dp(context, 14f), dp(context, 7f))
            background = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dp(context, 20f).toFloat()
                // 앱의 강조색(#FE9A00). 어떤 앱 위에 떠도 우리 것임을 알아볼 수 있다.
                setColor(Color.parseColor("#FE9A00"))
                setStroke(dp(context, 1f), Color.parseColor("#33000000"))
            }
        }
        label = pill

        return LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER
            addView(
                pill,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT
                )
            )
        }
    }

    private fun buildLayoutParams(context: Context): WindowManager.LayoutParams {
        val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        return WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            type,
            // 포커스도 터치도 받지 않는다 — 밑에 있는 앱을 그대로 쓸 수 있어야 한다.
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
            android.graphics.PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            // 상태바를 가리지 않도록 조금 내려서 띄운다.
            y = dp(context, 44f)
        }
    }
}
