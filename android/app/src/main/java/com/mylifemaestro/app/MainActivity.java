package com.mylifemaestro.app;

import android.Manifest;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Bundle;

import androidx.core.app.ActivityCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /** 알림 권한을 이미 물어봤는지 기억해 둔다. 앱을 껐다 켜도 남아야 해서 파일에 저장한다. */
    private static final String PREFS_STATE = "app_state";
    private static final String KEY_NOTIFICATION_ASKED = "notification_permission_asked";

    /** 이번 실행에서 이미 요청했는지. onResume 이 여러 번 불려도 한 번만 묻게 한다. */
    private boolean notificationAskedThisRun = false;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 웹에서 차단 엔진을 호출할 수 있도록 플러그인을 등록한다.
        // super.onCreate 보다 먼저 등록해야 브리지에 잡힌다.
        registerPlugin(BlockerPlugin.class);

        super.onCreate(savedInstanceState);
    }

    @Override
    public void onResume() {
        super.onResume();

        // 사용자가 설정 화면에서 권한을 켜고 돌아왔을 때 바로 반영되어야 하므로 여기서 확인한다.
        PermissionHelper.INSTANCE.logPermissionStatus(this);

        maybeRequestNotificationPermission();

        if (PermissionHelper.INSTANCE.canBlock(this)) {
            BlockerService.Companion.start(this);
        }
    }

    /**
     * 알림 권한을 **꼭 필요할 때 한 번만** 요청한다.
     *
     * ⚠️ 예전에는 onResume 마다 조건 없이 요청했다. 그게 다음 고리를 만들었다.
     *      onResume → requestPermissions → 시스템 권한 화면(PermissionController)이 위에 뜸
     *      → 우리 화면이 가려짐 → 권한 화면이 닫힘 → onResume → 다시 요청 → …
     *
     *    안드로이드 13+ 에서 사용자가 거부한 뒤에는 시스템이 **화면 없이 즉시 거부**로
     *    되돌려주는데, 그래도 requestPermissions 는 매번 권한 화면(액티비티)을 띄웠다 닫는다.
     *    그래서 거부 상태에서는 이 고리가 끝나지 않고, 그때마다 창 포커스를 빼앗겨
     *    **키보드가 내려가고 우리 액티비티가 가려졌다 돌아오기를 반복**한다.
     *    입력 중에 앱이 밖으로 튕겨 나간 것처럼 보이는 원인이 될 수 있다.
     *
     * 판단 기준
     *   - 이미 허용됨            → 아무것도 안 한다.
     *   - 이번 실행에서 이미 물음 → 안 한다. (onResume 재진입 고리 차단)
     *   - 물어본 적 없음          → 한 번 묻는다.
     *   - 물어봤는데 rationale 도 안 뜨는 상태 → 영구 거부다. **다시 묻지 않는다.**
     *     (물어본 적 없을 때도 rationale 은 false 라서, 저장해 둔 플래그로 둘을 구분한다)
     */
    private void maybeRequestNotificationPermission() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) return;
        if (PermissionHelper.INSTANCE.hasNotificationPermission(this)) return;
        if (notificationAskedThisRun) return;

        notificationAskedThisRun = true;

        SharedPreferences prefs = getSharedPreferences(PREFS_STATE, MODE_PRIVATE);
        boolean askedBefore = prefs.getBoolean(KEY_NOTIFICATION_ASKED, false);
        boolean canShowDialog = ActivityCompat.shouldShowRequestPermissionRationale(
            this, Manifest.permission.POST_NOTIFICATIONS
        );

        // 물어본 적이 있는데 rationale 도 못 띄우는 상태 = 영구 거부.
        // 여기서 요청해봐야 시스템 화면만 깜빡이고 결과는 그대로 거부다.
        if (askedBefore && !canShowDialog) return;

        prefs.edit().putBoolean(KEY_NOTIFICATION_ASKED, true).apply();
        PermissionHelper.INSTANCE.requestNotificationPermission(this);
    }
}
