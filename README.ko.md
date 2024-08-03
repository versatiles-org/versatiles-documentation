# 소개
VersaTiles는 상업적 이익을 전혀 갖지 않는 OpenStreetMap 데이터를 기반으로 하여 지도 타일을 생성, 배포, 사용하기 위한 완전한 FLOSS 스택입니다.  

# Versatiles는 무엇인가요?
이 도구는 지리 공간 데이터를 효과적으로 관리하고 시각화할 수 있도록 설계되었습니다. VersaTiles는 벡터 타일 형식을 사용하여 큰 데이터 세트를 압축하고, 빠르게 렌더링하며, 다양한 플랫폼에서 쉽게 접근할 수 있도록 합니다.

- [**웹 지도**][웹 지도]
- [**VersaTiles**][VersaTiles]
- [VersaTiles **서버**][VersaTiles 서버]
- *VersaTiles 캐싱*
- [VersaTiles **프론트엔드**][VersaTiles 프론트엔드]

# 초보자 가이드
VersaTiles를 처음 사용하는 사용자들을 위한 가이드입니다.
* [VersaTiles의 공용 타일 서버 사용하기](#versatiles의-공용-타일-서버-사용하기)
* [VersaTiles를 개인 서버에서 사용하기](#versatiles를-개인-서버에서-사용하기)
  * [VersaTiles 벡터 타일 다운로드](#versatiles-벡터-타일-다운로드)
  * [Versatiles 설치](#versatiles-설치)
    * [Linux, Mac](#linux--mac)
    * [Docker](#docker)
    * [Build from Source](#build-from-source)
  * [VersaTiles 실행](#versatiles-실행)

## VersaTiles의 공용 타일 서버 사용하기
자세한 내용은 [공용 타일 서버 사용하기] 항목을 참조하세요.  
  
## VersaTiles를 개인 서버에서 사용하기

### VersaTiles 벡터 타일 다운로드  
download.versatiles.org에서 행성 전체 타일을 다운로드합니다.

~~~shell
wget -c "https://download.versatiles.org/osm.versatiles"
~~~

행성 전체가 아닌 대륙, 국가, 도시만 필요한 경우 `versatiles`을(를) 사용하여 일부 지역의 타일만을 다운로드할 수도 있습니다.  

자세한 내용은 [벡터 타일 다운로드] 항목을 참조하세요.

### Versatiles 설치

VersaTiles는 타일 데이터를 처리하고 제공하기 위한 Rust 기반 프로젝트입니다.  
[Releases 페이지](https://github.com/versatiles-org/versatiles-rs/releases/)는 다양한 운영체제 및 아키텍처를 위하여 사전 컴파일된 바이너리를 제공합니다.

### Linux , Mac 
아래 스크립트는 사전 컴파일된 바이너리를 다운로드하고 /usr/local/bin/에 복사하여 `versatiles`를 설치합니다.
<details><summary>접기/펼치기</summary>

~~~shell
#!/bin/bash

if [ "$EUID" -ne 0 ]; then
  echo "This script must be run as root."
  exit 1
fi

set -e

# Determine the architecture and OS type
ARCH=$(uname -m)
OS=$(uname -s | tr '[:upper:]' '[:lower:]')

# Base URL for downloads
BASE_URL="https://github.com/versatiles-org/versatiles-rs/releases/latest/download/versatiles"

# Determine the libc type for Linux
if [ "$OS" == "linux" ]; then
  LIBC=$(ldd --version 2>&1 | head -n 1 | tr '[:upper:]' '[:lower:]' | grep -o 'musl\|glibc')
fi

# Map architecture and OS to the correct download suffix
case "$OS-$ARCH" in
  linux-aarch64)
    if [ "$LIBC" == "musl" ]; then
      SUFFIX="linux-musl-aarch64.tar.gz"
    else
      SUFFIX="linux-gnu-aarch64.tar.gz"
    fi
    ;;
  linux-x86_64)
    if [ "$LIBC" == "musl" ]; then
      SUFFIX="linux-musl-x86_64.tar.gz"
    else
      SUFFIX="linux-gnu-x86_64.tar.gz"
    fi
    ;;
  darwin-arm64)
    SUFFIX="macos-aarch64.tar.gz"
    ;;
  darwin-x86_64)
    SUFFIX="macos-x86_64.tar.gz"
    ;;
  *)
    echo "Unsupported OS or architecture: $OS-$ARCH"
    exit 1
    ;;
esac

# Full URL
URL="$BASE_URL-$SUFFIX"

# Download and extract the binary directly to /usr/local/bin/
echo "Downloading and extracting $URL..."
curl -Ls "$URL" | sudo tar -xzf - -C /usr/local/bin versatiles

# Set execute permissions for the binary
sudo chmod +x /usr/local/bin/versatiles

echo "Installation complete!"
~~~
</details>

Mac 사용자를 위한 대안으로 Homebrew를 사용하여 `versatiles`를 설치할 수 있습니다.

~~~shell
brew tap versatiles-org/versatiles
brew install versatiles
~~~

#### Docker
간편한 배포를 위한 Docker 이미지가 준비되어 있습니다.

~~~shell
docker pull versatiles-org/versatiles
~~~

#### Build from Source
소스에서 VersaTiles를 빌드하기 위해서는 Rust가 사전 설치되어 있어야 합니다.   
시스템에 Rust가 설치되어 있지 않은가요? [Rust 설치](https://www.rust-lang.org/tools/install)

아래 명령을 실행합니다.

~~~shell
cargo install versatiles
~~~

자세한 내용은 [VersaTiles 설치] 항목을 참조하세요.

### VersaTiles 실행

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
[벡터 타일 다운로드]: guides/download_tiles.md

[VersaTiles 설치]: guides/install_versatiles.md
[Linux에서]: guides/local_server_debian.md
[Mac에서]: guides/local_server_mac.md
[Docker를 사용하여]: guides/local_server_docker.md
[Debian에서]: guides/deploy_on_debian.md

[Google Cloud에서]: guides/deploy_in_google_cloud.md
[Android 및 iOS 앱에서 VersaTiles 사용 방법]: guides/what_about_mobile.md
[QGIS에서 VersaTiles 사용 방법]: guides/use_versatiles_in_qgis.md
