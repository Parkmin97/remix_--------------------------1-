# 안드로이드 릴리스 서명 체계 구축 (2026-09-07)

담당: android-native-engineer · 목적: Google Play 비공개 테스트 업로드 가능 상태 만들기

이전 상태는 debug 서명 APK뿐이라 Play에 올릴 수 없었다. 아래로 릴리스 서명·AAB 빌드가 가능해졌다.

---

## 1. 생성된 것

| 파일 | 내용 | git |
|------|------|-----|
| `android/upload-keystore.jks` | 업로드 키스토어 (PKCS12) | **커밋 금지** (gitignore) |
| `android/keystore.properties` | 키스토어 비밀번호·별칭 | **커밋 금지** (gitignore) |
| `android/upload_certificate.pem` | 업로드 인증서(공개키). Play Console 업로드 키 등록·재설정 시 제출 | 공개 정보이므로 커밋 무해 |

### 키스토어 사양

```
저장소 형식   PKCS12
별칭(alias)   upload
키 알고리즘   RSA 4096-bit
서명 알고리즘 SHA384withRSA
DN            CN=My Life Maestro, OU=Mobile, O=My Life Maestro, L=Seoul, ST=Seoul, C=KR
유효기간      2026-09-07 ~ 2056-08-30 (10950일 / 30년)
SHA-256 지문  FC:E0:4F:C5:B2:4A:DB:35:EE:BA:84:D9:E5:8A:A4:DA:DE:BD:46:F8:A9:B9:B7:A4:B1:EF:57:B7:E7:03:F4:3A
SHA-1  지문   23:31:7A:FC:37:D9:57:E3:ED:B1:E6:B7:CD:79:85:8D:63:50:D0:F1
```

비밀번호는 32자 랜덤 문자열로 생성해 `android/keystore.properties` 에 기록했다. store/key 비밀번호는 동일하다.
(Android Studio 공식 문서도 키 비밀번호를 키스토어 비밀번호와 같게 두라고 안내한다 — 다르게 두면 알려진 이슈가 있다.)

유효기간 근거 — 공식 문서(developer.android.com/studio/publish/app-signing):
> "If you plan to publish your apps on Google Play, the key you use to sign your app must have a validity period ending after 22 October 2033."
> "A validity period of 25 years or more is recommended."

2056년 만료이므로 두 조건 모두 충족한다.

---

## 2. 빌드 설정 변경

### `android/app/build.gradle`

- 파일 상단에서 `rootProject.file("keystore.properties")` 를 읽는다.
- **파일이 없거나 storeFile 이 실재하지 않으면 `keystoreProperties = null` 로 두고 서명 설정을 아예 붙이지 않는다.** 새로 클론한 개발자·CI에서도 debug 빌드가 그대로 된다. (검증 완료 — 아래 4절)
- `signingConfigs.release` 는 `keystoreProperties != null` 일 때만 정의되고, `buildTypes.release` 에서도 그때만 `signingConfig` 를 지정한다.
- 서명 스킴: `enableV1Signing = false`, `enableV2Signing = true`, `enableV3Signing = true`.
  minSdk 24(Android 7.0)부터 APK Signature Scheme v2 를 지원하므로 구형 v1(JAR) 서명은 불필요하다.
  ⚠️ 주의: Groovy DSL 에서 `enableV1Signing true` 처럼 `=` 없이 쓰면 **조용히 무시된다.** 반드시 `=` 로 대입할 것 (실제로 겪음).

### 버전

```groovy
versionCode 1
versionName "1.0.0"
```

`versionName` 은 `"1.0"` → `"1.0.0"` 으로 정리. `versionCode` 는 아직 Play에 아무것도 올린 적이 없으므로 첫 업로드용으로 1을 유지한다.

**versionCode 올리는 규칙 (반드시 지킬 것)**
- Play는 같은 `versionCode` 를 두 번 받지 않는다. 내부/비공개 테스트 트랙에 올린 것도 소모된 것으로 친다.
- 업로드할 때마다 `android/app/build.gradle` 의 `versionCode` 를 **+1** 한다. 되돌리거나 건너뛰어도 되지만 절대 내리거나 재사용할 수 없다.
- `versionName` 은 사람이 보는 문자열이라 자유지만, 버그픽스면 1.0.1, 기능추가면 1.1.0 식으로 맞춘다.
- 예: `versionCode 1 / "1.0.0"` → 다음 업로드 `versionCode 2 / "1.0.1"`

---

## 3. 빌드 방법 (⚠️ JDK 주의)

**Android Studio 번들 JDK(JBR)는 현재 쓸 수 없다.** 이 맥의 Android Studio JBR은 JDK 25인데, 프로젝트가 쓰는 Gradle 8.14.3이 클래스 파일 major version 69(=JDK 25)를 못 읽는다:

```
BUG! exception in phase 'semantic analysis' in source unit '_BuildScript_'
Unsupported class file major version 69
```

→ **JDK 21로 빌드한다.**

```bash
# 1) 웹 자산 빌드 + 동기화 (프로젝트 루트에서)
npm run build && npx cap sync android

# 2) AAB (Play 업로드용)
cd android
JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" ./gradlew bundleRelease

# 3) APK (사이드로드 테스트용, 선택)
JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home" ./gradlew assembleRelease
```

나중에 Gradle을 9.x 이상으로 올리면 JBR(JDK 25)로도 빌드할 수 있다. 지금은 JDK 21 고정.

### 산출물

| 산출물 | 경로 | 크기 |
|--------|------|------|
| AAB (Play 업로드) | `android/app/build/outputs/bundle/release/app-release.aab` | 17,876,016 B (약 17.1 MiB) |
| APK (사이드로드) | `android/app/build/outputs/apk/release/app-release.apk` | 18,280,683 B (약 17.4 MiB) |

minify/proguard는 손대지 않았다(`minifyEnabled false`). 현 구성 그대로 빌드가 통과한다.

---

## 4. 검증 결과 (추정 아님 — 실제 출력)

### AAB 서명 — `jarsigner -verify`

```
jar verified.

>>> Signer
X.509, CN=My Life Maestro, OU=Mobile, O=My Life Maestro, L=Seoul, ST=Seoul, C=KR
Signature algorithm: SHA384withRSA, 4096-bit RSA key
[certificate is valid from 9/7/26, 12:28 PM to 8/30/56, 12:28 PM]
```

경고로 나오는 "self-signed", "certificate chain is invalid", "no timestamp"는 앱 서명 키에서는 **정상**이다. 앱 서명 인증서는 CA가 발급하지 않는 자체 서명이다.

### AAB 안의 서명 인증서 ↔ 키스토어 인증서 대조

```
AAB(META-INF/UPLOAD.RSA) SHA256: FC:E0:4F:C5:B2:4A:DB:35:EE:BA:84:D9:E5:8A:A4:DA:DE:BD:46:F8:A9:B9:B7:A4:B1:EF:57:B7:E7:03:F4:3A
키스토어              SHA256: FC:E0:4F:C5:B2:4A:DB:35:EE:BA:84:D9:E5:8A:A4:DA:DE:BD:46:F8:A9:B9:B7:A4:B1:EF:57:B7:E7:03:F4:3A
```
→ 일치. 실제로 이 키스토어로 서명된 것이 맞다.

### APK 서명 — `apksigner verify` (build-tools 36.0.0)

```
Verifies
Verified using v1 scheme (JAR signing): false
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): true
Number of signers: 1
Signer #1 certificate DN: CN=My Life Maestro, OU=Mobile, O=My Life Maestro, L=Seoul, ST=Seoul, C=KR
Signer #1 certificate SHA-256 digest: fce04fc5b24adb35eeba84d9e58aa4dadebd46f8a9b9b7a4b1ef57b7e703f43a
Signer #1 key algorithm: RSA
Signer #1 key size (bits): 4096
```

### 패키지 정보 — `aapt2 dump badging`

```
package: name='com.mylifemaestro.app' versionCode='1' versionName='1.0.0' compileSdkVersion='36'
minSdkVersion:'24'
```

### 방어적 동작 검증

`keystore.properties` 를 잠시 치우고 빌드 → `assembleDebug` BUILD SUCCESSFUL, `assembleRelease` 도 BUILD SUCCESSFUL(서명만 미적용). 파일 복구 후 clean 재빌드에서 다시 서명이 붙는 것까지 확인했다.

### git 유출 방지 검증

```
$ git log --all --diff-filter=A -- '*.jks' '*.keystore' '*keystore.properties'
(출력 없음 — 과거에 커밋된 적 없음)

$ git check-ignore -v android/upload-keystore.jks android/keystore.properties
android/.gitignore:56:*.jks              android/upload-keystore.jks
android/.gitignore:58:keystore.properties  android/keystore.properties
```

루트 `.gitignore` 와 `android/.gitignore` 양쪽에 `*.jks` · `*.keystore` · `keystore.properties` 를 넣었다. (`android/.gitignore` 는 템플릿에 주석 처리돼 있던 줄을 살렸다.)

---

## 5. 🔴 사용자가 반드시 해야 할 백업

**지금 바로 해야 한다.** 이 두 파일은 git에 없고, 이 맥에만 있다. 맥이 고장나면 그대로 사라진다.

백업 대상 (둘 다 필요, 하나만 있으면 소용없다):
- `/Users/minkyu/Downloads/remix_-내인생-지휘자-배포용 (1)/android/upload-keystore.jks`
- `/Users/minkyu/Downloads/remix_-내인생-지휘자-배포용 (1)/android/keystore.properties` (비밀번호가 여기 있다)

백업 방법 (권장 순):
1. **비밀번호 관리자**(1Password, Bitwarden 등)에 `.jks` 파일 첨부 + 비밀번호를 별도 필드로 저장
2. 암호화된 외장 디스크 또는 개인 클라우드의 **비공개** 폴더 (공유 링크 금지)
3. 최소 2곳 이상에 보관

해서는 안 되는 것:
- git 커밋 (막아뒀지만 `git add -f` 로 강제하면 들어간다)
- 슬랙·카톡·이메일 등 평문 전송
- 공개 저장소·공개 드라이브 링크

### 잃어버리면 어떻게 되나 (공식 문서 확인함)

developer.android.com/studio/publish/app-signing 원문:

> "When you use Play App Signing, if you lose your upload key, or if it is compromised, you can request an upload key reset in the Play Console. Because your app signing key is secured by Google, you can continue to upload new versions of your app as updates to the original app, even if you change upload keys."
>
> "By comparison, for apps that have not opted in to Play App Signing, if you lose your app's signing key, you lose the ability to update your app."
>
> "Note: Resetting your upload key will not affect the app signing key that Google Play uses to re-sign APKs before delivering to users."

정리하면:

| | 앱 서명 키(app signing key) | 업로드 키(upload key) |
|---|---|---|
| 누가 갖나 | Play App Signing 사용 시 **구글이 보관** | **우리가 보관** (= 이번에 만든 키) |
| 분실 시 | (구글 보관이라 우리가 잃을 일 없음) | Play Console에서 **재설정 요청 가능** |
| 재설정 영향 | 없음 — 기존 앱 업데이트 계속 가능 | 새 키로 이후 업로드 |

**AAB로 업로드하면 Play App Signing 사용이 사실상 강제**(신규 앱은 AAB 필수)이므로, 이 업로드 키를 잃어도 앱 업데이트가 영구히 막히는 최악의 상황은 아니다. 다만 재설정은 구글 승인 절차가 필요하고 며칠 걸린다. **유출은 재설정보다 훨씬 나쁘다** — 남이 우리 이름으로 서명한 앱을 만들 수 있으므로, 분실보다 유출 방지가 우선이다.

`정식출시.md` STEP 9의 "잃어버리면 앱 업데이트를 영원히 못 합니다" 문구는 자체 서명 키 기준의 설명이라, Play App Signing 기준으로 정정했다.

### Play Console 첫 업로드 시

- Release > Setup > App signing 에서 Play App Signing 사용을 확인한다(신규 앱 기본값).
- 업로드 인증서 등록을 요구하면 `android/upload_certificate.pem` 을 제출한다.
- 앱 서명 키 지문(Play Console에 표시되는 SHA-1/SHA-256)은 **우리 업로드 키 지문과 다르다.** Firebase·구글 로그인·지도 API 등에 지문을 등록할 일이 생기면 **Play Console에 표시되는 앱 서명 키 지문**을 써야 한다. (현재 이 앱은 google-services.json 미사용이라 당장 해당 없음)

---

## 6. 남은 것 / 후속 담당

- [ ] 👤 사용자: 키스토어 2곳 이상 백업 (위 5절)
- [ ] release-qa: 서명된 릴리스 APK를 실기기에 설치해 debug 빌드와 동작 차이 확인 (`minifyEnabled false`라 난독화 이슈는 없을 것으로 보이나 실측 필요)
- [ ] release-qa: 릴리스 빌드에서 차단 엔진 생존성 재확인 — debug와 배터리 최적화 예외 동작이 다를 수 있음
- [ ] 추후: Gradle 9.x 업그레이드 시 JDK 25(JBR)로 빌드 가능해짐. 지금은 JDK 21 고정 필요
