package com.mylifemaestro.app

import android.content.Intent
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin

/**
 * 웹(React) ↔ 네이티브(차단 엔진) 사이의 통로.
 *
 * 웹은 화면과 사용자 설정을 담당하고, 실제 차단 판단과 감시는 네이티브가 한다.
 * 세션의 소유자는 [BlockSessionStore] 이며 웹은 여기를 통해 읽고 쓴다.
 */
@CapacitorPlugin(name = "Blocker")
class BlockerPlugin : Plugin() {

    // ─────────────────────────────────────────────
    // 권한
    // ─────────────────────────────────────────────

    /**
     * 차단에 필요한 특수 권한 상태를 조회한다.
     *
     * 이름을 `checkPermissions` 로 두지 않은 이유: Capacitor 의 Plugin 기반 클래스가
     * 같은 이름을 이미 쓰고 있고, 그쪽은 일반 런타임 권한(카메라 등)을 위한 것이다.
     * 우리 권한은 사용자가 시스템 설정에서 직접 켜야 하는 특수 접근 권한이라 성격이 다르다.
     */
    @PluginMethod
    fun checkBlockerPermissions(call: PluginCall) {
        val ctx = context
        call.resolve(
            JSObject()
                .put("usageStats", PermissionHelper.hasUsageStatsPermission(ctx))
                .put("overlay", PermissionHelper.hasOverlayPermission(ctx))
                .put("batteryOptimizationIgnored", PermissionHelper.isIgnoringBatteryOptimizations(ctx))
                .put("canBlock", PermissionHelper.canBlock(ctx))
        )
    }

    /** 사용 정보 접근 설정 화면으로 보낸다. 앱이 직접 부여할 수 없는 권한이다. */
    @PluginMethod
    fun requestUsageAccess(call: PluginCall) {
        PermissionHelper.openUsageAccessSettings(context)
        call.resolve()
    }

    /** 다른 앱 위에 표시 설정 화면으로 보낸다. */
    @PluginMethod
    fun requestOverlayPermission(call: PluginCall) {
        PermissionHelper.openOverlaySettings(context)
        call.resolve()
    }

    /** 배터리 최적화 예외 설정 화면으로 보낸다. 없으면 며칠 뒤 서비스가 죽을 수 있다. */
    @PluginMethod
    fun requestBatteryOptimizationExemption(call: PluginCall) {
        PermissionHelper.openBatteryOptimizationSettings(context)
        call.resolve()
    }

    // ─────────────────────────────────────────────
    // 설치된 앱 목록
    // ─────────────────────────────────────────────

    /**
     * 잠글 수 있는 앱 목록을 돌려준다.
     * 전화·설정·알람 등 막히면 위험한 앱은 애초에 빠져 있다.
     */
    @PluginMethod
    fun getInstalledApps(call: PluginCall) {
        val apps = AppListHelper.getLaunchableApps(context)
        val array = JSArray()

        apps.forEach { app ->
            array.put(
                JSObject()
                    .put("packageName", app.packageName)
                    .put("appName", app.appName)
                    .put("isPreinstalled", app.isPreinstalled)
                    // 안드로이드가 주는 분류값. 미분류가 57%라 분류에 쓰지 않고 진단용으로만 넘긴다.
                    .put("systemCategory", app.systemCategory)
            )
        }

        call.resolve(JSObject().put("apps", array))
    }

    // ─────────────────────────────────────────────
    // 세션
    // ─────────────────────────────────────────────

    /**
     * 잠금 세션을 시작한다.
     *
     * 모드 A(즉시 잠금)이면 usageEndsAt 을 0으로,
     * 모드 B(먼저 M분 쓰고 잠금)이면 사용 종료 시각을 넘긴다.
     */
    @PluginMethod
    fun startSession(call: PluginCall) {
        val sessionId = call.getString("sessionId")
        if (sessionId.isNullOrBlank()) {
            call.reject("sessionId 가 필요합니다")
            return
        }

        val lockEndsAt = call.getLong("lockEndsAt")
        if (lockEndsAt == null || lockEndsAt <= 0) {
            call.reject("lockEndsAt 이 필요합니다")
            return
        }

        val usageEndsAt = call.getLong("usageEndsAt") ?: 0L

        val packagesArray = call.getArray("blockedPackages")
        val packages = mutableSetOf<String>()
        if (packagesArray != null) {
            for (i in 0 until packagesArray.length()) {
                packagesArray.optString(i)?.takeIf { it.isNotBlank() }?.let { packages.add(it) }
            }
        }
        if (packages.isEmpty()) {
            call.reject("잠글 앱이 하나도 없습니다")
            return
        }

        BlockSessionStore.startSession(context, sessionId, lockEndsAt, usageEndsAt, packages)

        // 세션이 생겼으니 감시를 시작한다. 이미 돌고 있으면 무시된다.
        if (PermissionHelper.canBlock(context)) {
            BlockerService.start(context)
        }

        call.resolve()
    }

    /**
     * 세션을 끝낸다. 미션 성공 시 호출된다.
     * 우리 플로우에서 미션 성공은 "N분 해제"가 아니라 잠금 자체의 종료다.
     */
    @PluginMethod
    fun endSession(call: PluginCall) {
        val reason = call.getString("reason") ?: "웹에서 종료 요청"
        BlockSessionStore.endSession(context, reason)
        call.resolve()
    }

    /** 미션을 시도했음을 기록한다. 실패해도 이번 세션에서는 재도전할 수 없다. */
    @PluginMethod
    fun markMissionAttempted(call: PluginCall) {
        BlockSessionStore.markMissionAttempted(context)
        call.resolve()
    }

    /**
     * 실제 안드로이드 홈 화면으로 나간다.
     *
     * 잠금을 시작한 뒤 사용자를 앱에 붙잡아두면 안 된다.
     * 폰을 원래대로 쓰다가 잠근 앱을 열었을 때 차단되는 것이 이 제품의 흐름이다.
     * (예전에는 앱 안의 '가상 폰 화면'으로 보냈지만, 실제 차단이 되면서 필요 없어졌다.)
     */
    @PluginMethod
    fun goToHomeScreen(call: PluginCall) {
        val home = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_HOME)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        try {
            context.startActivity(home)
            call.resolve()
        } catch (e: Exception) {
            call.reject("홈 화면으로 이동할 수 없습니다", e)
        }
    }

    /** 현재 잠금 상태를 조회한다. */
    @PluginMethod
    fun getStatus(call: PluginCall) {
        val s = BlockSessionStore.getStatus(context)
        val packages = JSArray()
        s.blockedPackages.forEach { packages.put(it) }

        call.resolve(
            JSObject()
                .put("hasSession", s.hasSession)
                .put("isLocked", s.isLocked)
                .put("lockEndsAt", s.lockEndsAt)
                .put("usageEndsAt", s.usageEndsAt)
                .put("blockedPackages", packages)
                .put("missionAttempted", s.missionAttempted)
                .put("launchAttempts", s.launchAttempts)
        )
    }
}
