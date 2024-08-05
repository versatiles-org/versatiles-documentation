# VersaTiles 설치

시스템에 VersaTiles를 설치하는 다양한 방법을 설명합니다.

- [Release된 바이너리 다운로드](#바이너리-다운로드)
- 패키지 관리자 사용
  - [Debian 계열 Linux](#debian-계열-linux)
  - [MacOS](#macos)
- [Rust와 Cargo를 사용하여 소스에서 빌드](#rust와-cargo를-사용하여-소스에서-빌드)

##  바이너리 다운로드

[Releases 페이지](https://github.com/versatiles-org/versatiles-rs/releases/)에서 Linux와 Mac 운영체제를 위한 Rust로 사전 컴파일된 바이너리를 제공합니다.  
 
아래 스크립트는 사전 컴파일된 바이너리를 다운로드하여 `versatiles`를 설치합니다.
<details><summary>접기/펼치기</summary>

~~~shell
#!/bin/bash

[ "$EUID" -ne 0 ] && echo "This script must be run as root." && exit 1
set -e

# Determine OS and ARCH
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
LIBC=$(ldd --version 2>&1 | head -n 1 | grep -o 'musl\|glibc' || echo "gnu")

# Determine SUFFIX
case "$OS-$ARCH" in
  linux-aarch64) SUFFIX="linux-${LIBC}-aarch64.tar.gz" ;;
  linux-x86_64)  SUFFIX="linux-${LIBC}-x86_64.tar.gz" ;;
  darwin-arm64)  SUFFIX="macos-aarch64.tar.gz" ;;
  darwin-x86_64) SUFFIX="macos-x86_64.tar.gz" ;;
  *) echo "Unsupported OS/ARCH: $OS-$ARCH" && exit 1 ;;
esac

# Download and install
URL="https://github.com/versatiles-org/versatiles-rs/releases/latest/download/versatiles-$SUFFIX"
curl -Ls "$URL" | tar -xzf - -C /usr/local/bin versatiles && chmod +x /usr/local/bin/versatiles

versatiles --version
~~~
</details>

## 패키지 관리자 사용
### Debian 계열 Linux

아래 스크립트는 Dpkg를 사용하여 `versatiles`를 설치합니다.
<details><summary>접기/펼치기</summary>

```bash
#!/bin/bash

[ "$EUID" -ne 0 ] && echo "This script must be run as root." && exit 1
set -e

# Determine OS and ARCH
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Determine DEB package name
case "$OS-$ARCH" in
  linux-aarch64) DEB_PACKAGE="versatiles-linux-gnu-aarch64.deb" ;;
  linux-x86_64)  DEB_PACKAGE="versatiles-linux-gnu-x86_64.deb" ;;
  *) echo "Unsupported OS/ARCH: $OS-$ARCH" && exit 1 ;;
esac

# Download, install, and clean up in one line
URL="https://github.com/versatiles-org/versatiles-rs/releases/latest/download/$DEB_PACKAGE"
curl -Ls -o "/tmp/$DEB_PACKAGE" "$URL" && dpkg -i "/tmp/$DEB_PACKAGE" && rm "/tmp/$DEB_PACKAGE"

versatiles --version
```
</details>

### MacOS

Homebrew를 사용하여 `versatiles`를 설치하려면 터미널에서 다음 명령을 실행합니다.

```bash
brew tap diverses-org/versatiles
brew install versatiles
```

최신 버전의 `versatiles`로 업그레이드하려면 다음을 실행합니다.

```bash
brew update
brew upgrade versatiles
```

## Rust와 Cargo를 사용하여 소스에서 빌드

소스에서 `versatiles`를 빌드하려면 시스템에 Rust와 Cargo가 설치되어 있어야 합니다. 설치되어 있지 않으면 [여기](https://www.rust-lang.org/tools/install)에서 설치할 수 있습니다.

Rust와 Cargo를 설치한 후 다음 명령을 실행합니다.

```bash
cargo install versatiles --all-features
```
