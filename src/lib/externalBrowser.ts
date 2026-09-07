import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * 앱 또는 웹에서 안전하게 외부 링크/약관 문서를 여는 유틸리티 함수.
 * 
 * - 네이티브(안드로이드/iOS) 앱: 
 *   앱 내 웹뷰가 덮어씌워져 앱에 갇히는 현상을 방지하기 위해 
 *   인앱 크롬 커스텀 탭(Custom Tabs)으로 열며, 상단 X 버튼으로 언제든 앱 복귀가 가능합니다.
 * - 일반 웹 브라우저: 
 *   새 창(window.open)으로 엽니다.
 */
export async function openExternalUrl(rawUrl: string): Promise<void> {
  if (!rawUrl) return;

  // 상대 경로인 경우 현재 도메인/origin을 붙여 절대 URL로 변환
  const targetUrl = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : `${window.location.origin}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;

  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({
        url: targetUrl,
        presentationStyle: 'popover',
      });
      return;
    } catch (err) {
      console.warn('[externalBrowser] Browser.open 실패, window.open으로 대체:', err);
    }
  }

  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}
