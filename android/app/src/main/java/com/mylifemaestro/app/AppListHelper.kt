package com.mylifemaestro.app

import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.pm.ResolveInfo
import android.os.Build
import android.util.Log

/**
 * 설치된 앱 목록을 조회한다. 차단 대상 선택 화면에 쓰인다.
 *
 * 조회 방식은 이 파일 한 곳에만 둔다.
 * 안드로이드의 패키지 가시성 정책은 버전마다 조여지므로, 막히면 여기만 교체하면 되도록 격리한다.
 *
 * 정책 근거(2026-08-07 확인):
 * - AndroidManifest 의 <queries> 에 LAUNCHER intent 를 선언하면
 *   화면이 있는 설치 앱 전체를 조회할 수 있고, QUERY_ALL_PACKAGES 권한이 필요 없다.
 * - 구글 정책상 QUERY_ALL_PACKAGES 는 "더 좁은 방법으로 가능하면" 사용이 금지되므로
 *   우리는 이 방식을 써야 한다.
 */
object AppListHelper {

    private const val TAG = "AppListHelper"

    /**
     * 절대 차단하면 안 되는 앱들. 막히면 사용자가 위험해지거나 앱을 해제할 수 없게 된다.
     *
     * ⚠️ 시스템 앱(FLAG_SYSTEM)이라는 이유로 거르지 않는다.
     *    2026-08-07 실기기(삼성 A32) 확인 결과 **유튜브가 SYSTEM + UPDATED_SYSTEM_APP** 이었다.
     *    선탑재 앱이라는 것과 사용자가 실제로 쓰는 앱이라는 것은 완전히 별개다.
     *    시스템 앱을 일괄 제외하면 우리 핵심 차단 대상인 유튜브가 목록에서 사라진다.
     */
    private val NEVER_BLOCKABLE = setOf(
        // 통화 — 긴급 상황에 막히면 안 된다
        "com.android.dialer",
        "com.android.phone",
        "com.samsung.android.dialer",
        "com.samsung.android.incallui",
        // 긴급 전화
        "com.android.emergency",
        // 시스템 설정 — 여기서 권한을 껐다 켜야 한다
        "com.android.settings",
        "com.samsung.android.settings",
        // 알람/시계 — 막으면 기상 실패 등 실생활 피해
        "com.android.deskclock",
        "com.sec.android.app.clockpackage",
        // 연락처
        "com.android.contacts",
        "com.samsung.android.app.contacts"
    )

    /** 차단 대상 후보 앱 하나. */
    data class InstalledApp(
        val packageName: String,
        val appName: String,
        /** 제조사/OS 선탑재 앱인지. **거르는 기준이 아니라 참고용 정보다.** */
        val isPreinstalled: Boolean
    )

    /**
     * 홈 화면에 아이콘이 있는 앱을 모두 반환한다.
     *
     * 거르는 것은 두 가지뿐이다.
     *  1. 자기 자신 — 스스로를 차단하면 해제할 방법이 없어진다
     *  2. [NEVER_BLOCKABLE] — 전화·설정·알람 등 막히면 위험한 앱
     *
     * 그 외에는 선탑재든 아니든 전부 노출한다. 무엇을 막을지는 사용자가 정한다.
     */
    fun getLaunchableApps(context: Context): List<InstalledApp> {
        val pm = context.packageManager

        val launcherIntent = Intent(Intent.ACTION_MAIN).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }

        val resolved: List<ResolveInfo> = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pm.queryIntentActivities(
                launcherIntent,
                PackageManager.ResolveInfoFlags.of(0L)
            )
        } else {
            @Suppress("DEPRECATION")
            pm.queryIntentActivities(launcherIntent, 0)
        }

        val myPackage = context.packageName

        return resolved
            .asSequence()
            .mapNotNull { info ->
                val appInfo = info.activityInfo?.applicationInfo ?: return@mapNotNull null
                val pkg = appInfo.packageName

                // 자기 자신은 차단 대상이 될 수 없다
                if (pkg == myPackage) return@mapNotNull null

                // 막히면 위험한 앱은 애초에 목록에 올리지 않는다
                if (pkg in NEVER_BLOCKABLE) return@mapNotNull null

                InstalledApp(
                    packageName = pkg,
                    appName = appInfo.loadLabel(pm).toString(),
                    isPreinstalled = (appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                )
            }
            // 같은 앱이 여러 진입점(액티비티)을 가질 수 있어 패키지 기준으로 중복 제거
            .distinctBy { it.packageName }
            .sortedBy { it.appName }
            .toList()
    }

    /**
     * 스파이크 검증용. 조회 결과를 로그로 찍는다.
     * `adb logcat | grep AppListHelper` 로 확인한다.
     */
    fun logInstalledApps(context: Context) {
        val apps = getLaunchableApps(context)
        val preinstalled = apps.count { it.isPreinstalled }

        Log.i(TAG, "===== 앱 목록 조회 결과 =====")
        Log.i(TAG, "차단 후보 앱: ${apps.size}개 (선탑재 ${preinstalled}개 포함)")
        Log.i(TAG, "-----------------------------")
        apps.forEach { app ->
            val mark = if (app.isPreinstalled) "[선탑재]" else "        "
            Log.i(TAG, "  $mark ${app.appName}  |  ${app.packageName}")
        }
        Log.i(TAG, "=============================")
    }
}
