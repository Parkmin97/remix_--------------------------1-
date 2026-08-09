package com.mylifemaestro.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * 재부팅 후 감시 서비스를 다시 켠다.
 *
 * 이게 없으면 사용자가 폰을 껐다 켜는 순간 차단이 조용히 풀린다.
 * 사용자는 모르고 있다가 "어제는 막혔는데 오늘은 안 막히네"를 겪는다.
 * 조용히 실패하는 것이 이 제품에서 가장 나쁜 실패다.
 *
 * ⚠️ 재부팅 직후에는 아직 권한이 확인되지 않았을 수 있으므로 반드시 검사한 뒤 켠다.
 * ⚠️ 제조사에 따라 이 브로드캐스트를 받지 못하는 경우가 있다(삼성 포함).
 *    그래서 이것만 믿지 않고, 앱이 열릴 때도 서비스 상태를 확인해 다시 켠다.
 */
class BootReceiver : BroadcastReceiver() {

    companion object {
        private const val TAG = "BootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action ?: return
        Log.i(TAG, "부팅 관련 브로드캐스트 수신: $action")

        val isBootAction = action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_LOCKED_BOOT_COMPLETED ||
            // 삼성 등 일부 제조사가 쓰는 자체 부팅 완료 신호
            action == "android.intent.action.QUICKBOOT_POWERON" ||
            action == "com.htc.intent.action.QUICKBOOT_POWERON" ||
            // 앱이 업데이트된 뒤에도 서비스가 꺼지므로 같이 처리한다
            action == Intent.ACTION_MY_PACKAGE_REPLACED

        if (!isBootAction) return

        if (!PermissionHelper.canBlock(context)) {
            Log.w(TAG, "권한이 없어 서비스를 켜지 않음 — 사용자가 앱에서 다시 허용해야 함")
            return
        }

        Log.i(TAG, "감시 서비스 재시작")
        SurvivalTracker.onBootRecovery(context)
        runCatching { BlockerService.start(context) }
            .onFailure { Log.e(TAG, "서비스 재시작 실패", it) }
    }
}
