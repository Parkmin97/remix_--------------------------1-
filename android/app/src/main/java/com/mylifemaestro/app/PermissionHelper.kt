package com.mylifemaestro.app

import android.Manifest
import android.app.Activity
import android.app.AppOpsManager
import android.content.Context
import android.content.pm.PackageManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.os.Process
import android.provider.Settings
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

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
    // 3. 배터리 최적화 예외 (서비스 생존의 핵심)
    // ─────────────────────────────────────────────

    /**
     * 배터리 최적화에서 제외되어 있는지 확인한다.
     *
     * 제외되지 않으면 안드로이드가 절전을 이유로 우리 서비스를 죽인다.
     * 특히 삼성은 자체 절전 정책이 더 공격적이라 이것만으로 충분하지 않을 수 있다.
     */
    fun isIgnoringBatteryOptimizations(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true

        val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            ?: return false
        return pm.isIgnoringBatteryOptimizations(context.packageName)
    }

    /**
     * 배터리 최적화 예외 설정 화면을 연다.
     *
     * ⚠️ `ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS`(다이얼로그 즉시 표시)는
     *    구글 정책상 용도가 제한되어 있어 심사에서 문제가 될 수 있다.
     *    대신 설정 목록 화면으로 보내고 사용자가 직접 고르게 한다. 안전한 쪽을 택했다.
     */
    fun openBatteryOptimizationSettings(context: Context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return

        val intent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        runCatching { context.startActivity(intent) }
            .onFailure { Log.e(TAG, "배터리 최적화 설정 화면을 열 수 없음", it) }
    }

    // ─────────────────────────────────────────────
    // 4. 알림 (안드로이드 13부터 런타임 권한)
    // ─────────────────────────────────────────────

    /**
     * 알림을 표시할 수 있는지.
     *
     * ⚠️ 안드로이드 13(API 33)부터 알림은 **런타임 권한**이다.
     *    매니페스트 선언만으로는 부여되지 않고 사용자에게 직접 요청해야 한다.
     *    없으면 포그라운드 서비스의 상시 알림조차 표시되지 않아,
     *    사용자는 앱이 백그라운드에서 도는 것을 알 수 없다. (8/9 실기기에서 확인)
     */
    fun hasNotificationPermission(context: Context): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return true

        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.POST_NOTIFICATIONS
        ) == PackageManager.PERMISSION_GRANTED
    }

    /**
     * 알림 권한을 요청한다. 이건 팝업으로 받을 수 있는 일반 런타임 권한이다.
     * (사용 정보·오버레이 권한과 달리 설정 화면으로 보낼 필요가 없다)
     */
    fun requestNotificationPermission(activity: Activity) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return
        if (hasNotificationPermission(activity)) return

        ActivityCompat.requestPermissions(
            activity,
            arrayOf(Manifest.permission.POST_NOTIFICATIONS),
            REQ_NOTIFICATION
        )
    }

    const val REQ_NOTIFICATION = 2001

    // ─────────────────────────────────────────────
    // 5. 종합
    // ─────────────────────────────────────────────

    /**
     * 차단 기능이 동작할 수 있는 최소 조건.
     *
     * 배터리 최적화 예외는 여기 포함하지 않는다.
     * 없어도 당장은 동작하기 때문이다. 다만 며칠 뒤 죽을 확률이 크게 올라간다.
     */
    fun canBlock(context: Context): Boolean =
        hasUsageStatsPermission(context) && hasOverlayPermission(context)

    /** 스파이크 검증용. 현재 권한 상태를 로그로 찍는다. */
    fun logPermissionStatus(context: Context) {
        val usage = hasUsageStatsPermission(context)
        val overlay = hasOverlayPermission(context)

        val battery = isIgnoringBatteryOptimizations(context)

        Log.i(TAG, "===== 권한 상태 =====")
        Log.i(TAG, "사용 정보 접근: ${if (usage) "✅ 허용됨" else "❌ 없음"}")
        Log.i(TAG, "다른 앱 위에 표시: ${if (overlay) "✅ 허용됨" else "❌ 없음"}")
        Log.i(TAG, "배터리 최적화 예외: ${if (battery) "✅ 제외됨" else "⚠️ 미적용 (며칠 뒤 서비스가 죽을 수 있음)"}")
        Log.i(TAG, "알림: ${if (hasNotificationPermission(context)) "✅ 허용됨" else "❌ 없음 (상시 알림도 안 보임)"}")
        Log.i(TAG, "차단 가능 상태: ${if (canBlock(context)) "✅ 가능" else "❌ 불가"}")
        Log.i(TAG, "=====================")
    }
}
