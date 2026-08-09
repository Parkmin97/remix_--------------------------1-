package com.mylifemaestro.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 웹에서 차단 엔진을 호출할 수 있도록 플러그인을 등록한다.
        // super.onCreate 보다 먼저 등록해야 브리지에 잡힌다.
        registerPlugin(BlockerPlugin.class);

        super.onCreate(savedInstanceState);

        // 검증용 로그는 제거했다. 앱 목록과 스크린타임 모두 실기기에서 확인을 마쳤고,
        // 이제 BlockerPlugin 을 통해 웹에서 정식으로 호출한다.
        // 다시 확인이 필요하면 AppListHelper.logInstalledApps() /
        // ScreenTimeHelper.logRecentUsage() 를 임시로 부르면 된다.
    }

    @Override
    public void onResume() {
        super.onResume();

        // [스파이크 2026-08-07] 권한 상태 확인용.
        // onResume 에 두는 이유: 사용자가 설정 화면에서 권한을 켜고 돌아왔을 때
        // 바로 반영되는지 확인해야 하기 때문이다. 실제 구현에서도 이 시점에 다시 확인한다.
        // 확인 방법: adb logcat | grep PermissionHelper
        PermissionHelper.INSTANCE.logPermissionStatus(this);

        // 안드로이드 13+ 는 알림도 런타임 권한이다.
        // 없으면 포그라운드 서비스의 상시 알림조차 표시되지 않는다.
        PermissionHelper.INSTANCE.requestNotificationPermission(this);

        // [스파이크 2026-08-07] 권한이 다 있으면 감시 서비스를 켠다.
        // 정식 구현에서는 사용자가 "차단 시작"을 눌렀을 때만 켜야 한다.
        if (PermissionHelper.INSTANCE.canBlock(this)) {
            BlockerService.Companion.start(this);
        }
    }
}
