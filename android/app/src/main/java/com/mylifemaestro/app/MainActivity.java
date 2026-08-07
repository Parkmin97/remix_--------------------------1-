package com.mylifemaestro.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // [스파이크 2026-08-07] 앱 목록 조회가 위험 권한 없이 되는지 검증용.
        // 확인이 끝나면 이 줄을 지우고 Capacitor 플러그인으로 정식 구현한다.
        // 확인 방법: adb logcat | grep AppListHelper
        AppListHelper.INSTANCE.logInstalledApps(this);
    }
}
