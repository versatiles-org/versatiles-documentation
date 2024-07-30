# 소개
VersaTiles는 상업적 이익을 전혀 갖지 않는 OpenStreetMap 데이터를 기반으로 하여 지도 타일을 생성, 배포, 사용하기 위한 완전한 FLOSS 스택입니다.

## Versatiles는 무엇인가요?
이 도구는 지리 공간 데이터를 효과적으로 관리하고 시각화할 수 있도록 설계되었습니다. VersaTiles는 벡터 타일 형식을 사용하여 큰 데이터 세트를 압축하고, 빠르게 렌더링하며, 다양한 플랫폼에서 쉽게 접근할 수 있도록 합니다.

- [**웹 지도**][웹 지도]
- [**VersaTiles**][VersaTiles]
- [VersaTiles **서버**][VersaTiles 서버]
- *VersaTiles 캐싱*
- [VersaTiles **프론트엔드**][VersaTiles 프론트엔드]

## 초보자 가이드
VersaTiles를 처음 사용하는 사용자들을 위한 단계별 가이드입니다.

### [VersaTiles의 공용 타일 서버 사용하기][공용 타일 서버 사용하기]
 
### VersaTiles를 개인 서버에 설치하고 실행하기
1. VersaTiles 설치하기
  - VersaTiles 바이너리를 개인 서버에 다운로드 합니다. 자세한 내용은 [VersaTiles 설치]항목을 참조하세요.
3. [VersaTiles 벡터 타일 **다운로드**][벡터 타일 다운로드하기]

## VersaTiles 서버 배포
- … [**Debian**에서][Debian에서]
- … [**Google Cloud**에서][Google Cloud에서]
- … **Digital Ocean**에서
- … **Kubernetes**에서
- … **Raspberry Pi**에서
- … **AWS**에서

## 고급 가이드
- [**Android 및 iOS** 앱에서 VersaTiles 사용 방법?][Android 및 iOS 앱에서 VersaTiles 사용 방법]
- [**QGIS**에서 VersaTiles 사용 방법?][QGIS에서 VersaTiles 사용 방법]
- *최대한의 프라이버시를 유지하며 모바일 앱에 지도를 추가하는 방법, 예를 들어 서버를 앱에 포함시키는 방법?*


[웹 지도]: basics/web_maps.md
[VersaTiles]: basics/versatiles.md
[VersaTiles 서버]: basics/versatiles_server.md
[VersaTiles 프론트엔드]: basics/frontend.md
[공용 타일 서버 사용하기]: guides/use_tiles.versatiles.org.md
[VersaTiles 설치하기]: guides/install_versatiles.md
[벡터 타일 다운로드하기]: guides/download_tiles.md

[VersaTiles 설치]: guides/install_versatiles.md
[Linux에서]: guides/local_server_debian.md
[Mac에서]: guides/local_server_mac.md
[Docker를 사용하여]: guides/local_server_docker.md
[Debian에서]: guides/deploy_on_debian.md

[Google Cloud에서]: guides/deploy_in_google_cloud.md
[Android 및 iOS 앱에서 VersaTiles 사용 방법]: guides/what_about_mobile.md
[QGIS에서 VersaTiles 사용 방법]: guides/use_versatiles_in_qgis.md
