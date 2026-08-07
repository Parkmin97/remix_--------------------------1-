package com.mylifemaestro.app

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Process
import android.provider.Settings
import android.util.Log

/**
 * 차단 엔진에 필요한 두 권한의 보유 여부 확인 및 설정 화면 이동을 담당한다.
 *
 * ⚠️ 이 둘은 일반 권한과 다르다.
 *    앱이 팝업을 띄워 받을 수 없고, **사용자가 시스템 설정에 직접 들어가서 켜야 한다.**
 *    그래서 "설정으로 보내기 → 돌아온 뒤 다시 확인" 흐름이 필요하다.
 *    사용자 이탈이 가장 많이 발생하는 구간이므로, 왜 필요한지 설명하는 화면이 반드시 앞에 와야 한다.
 */
object PermissionHelper {

    private const val TAG = "PermissionHelper"

    // ─────────────────────────────────────────────
    // 1. 사용 정보 접근 (어떤 앱이 켜져 있는지 알아내기)
    // ─────────────────────────────────────────────

    /**
     * 사용 정보 접근 권한이 있는지 확인한다.
     *
     * PACKAGE_USAGE_STATS 는 매니페스트에 선언만으로는 부여되지 않는 특수 권한이라
     * AppOps 로 실제 허용 상태를 조회해야 한다.
     */
    fun hasUsageStatsPermission(context: Context): Boolean {
        val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as? AppOpsManager
            ?: return false

        val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            appOps.unsafeCheckOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        } else {
            @Suppress("DEPRECATION")
            appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.packageName
            )
        }

        return mode == AppOpsManager.MODE_ALLOWED
    }

    /** 사용 정보 접근 설정 화면을 연다. 사용자가 목록에서 우리 앱을 찾아 켜야 한다. */
    fun openUsageAccessSettings(context: Context) {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { context.startActivity(intent) }
            .onFailure { Log.e(TAG, "사용 정보 접근 설정 화면을 열 수 없음", it) }
    }

    // ─────────────────────────────────────────────
    // 2. 다른 앱 위에 표시 (차단 화면 띄우기)
    // ─────────────────────────────────────────────

    /** 다른 앱 위에 그릴 수 있는지 확인한다. */
    fun hasOverlayPermission(context: Context): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Settings.canDrawOverlays(context)
        } else {
            true // 안드로이드 6 미만은 설치 시 자동 부여
        }
    }

    /** 다른 앱 위에 표시 설정 화면을 연다. 우리 앱 항목으로 바로 이동한다. */
    fun openOverlaySettings(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return

        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${context.packageName}")
        ).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { context.startActivity(intent) }
            .onFailure { Log.e(TAG, "오버레이 설정 화면을 열 수 없음", it) }
    }

    // ─────────────────────────────────────────────
    // 3. 종합
    // ─────────────────────────────────────────────

    /** 차단 기능이 실제로 동작할 수 있는 상태인지. 둘 다 있어야 한다. */
    fun canBlock(context: Context): Boolean =
        hasUsageStatsPermission(context) && hasOverlayPermission(context)

    /** 스파이크 검증용. 현재 권한 상태를 로그로 찍는다. */
    fun logPermissionStatus(context: Context) {
        val usage = hasUsageStatsPermission(context)
        val overlay = hasOverlayPermission(context)

        Log.i(TAG, "===== 권한 상태 =====")
        Log.i(TAG, "사용 정보 접근: ${if (usage) "✅ 허용됨" else "❌ 없음"}")
        Log.i(TAG, "다른 앱 위에 표시: ${if (overlay) "✅ 허용됨" else "❌ 없음"}")
        Log.i(TAG, "차단 가능 상태: ${if (canBlock(context)) "✅ 가능" else "❌ 불가"}")
        Log.i(TAG, "=====================")
    }
}
