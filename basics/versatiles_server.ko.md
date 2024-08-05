# VersaTiles 서버는 어떻게 작동하나요?

Rust로 작성되어 리소스 사용량이 적으면서도 뛰어난 성능을 제공하는 VersaTiles 서버의 주요 구성 요소와 기능을 살펴봅니다.

# 파일 형식

VersaTiles의 핵심 개념 중 하나는 맵 데이터를 저장하기 위한 고유한 [.versatiles 파일 형식](https://github.com/versatiles-org/versatiles-spec)입니다. 이 형식은 행성 전체의 모든 맵 타일을 포함할 뿐만 아니라 파일 내에서 해당 바이트 오프셋과 길이를 포함한 모든 맵 타일의 인덱스도 포함합니다.

.versatiles 형식의 진짜 매력은 로컬에 저장할 필요가 없다는 것입니다. 대신 예를 들어 HTTP를 사용하여 원격으로 액세스할 수 있습니다. 이는 VersaTiles 서버가 필요한 맵 타일 데이터가 포함된 .versatiles 파일의 특정 부분을 검색할 수 있도록 하는 HTTP 바이트 범위 요청 덕분에 가능합니다. 이 기능을 사용하면 VersaTiles 서버는 전체 .versatiles 파일을 로컬에 두지 않고도 맵 타일을 효율적으로 제공할 수 있습니다. 이를 통해 VersaTiles로 확장 가능한 맵 인프라를 훨씬 더 쉽게 구축할 수 있습니다.

HTTP 바이트 범위 요청을 통해 액세스할 수 있는 컨테이너를 개발한다는 아이디어는 [COMTiles](https://github.com/mactrem/com-tiles) 및 [PMTiles](https://github.com/protomaps/PMTiles)를 기반으로 합니다. 그러나 우리는 약간 다른 부분에 초점을 맞추고, 필요한 경우 이전 구현에서 벗어나야 할 필요성을 느꼈기 때문에 자체 표준을 개발하기로 결정했습니다. 그러나 우리는 파이프라인에서 대안으로 COMTiles 및 PMTiles를 지원하는 데 매우 열려 있습니다.

# 설치 및 설정

먼저 VersaTiles를 설치해야 합니다: [VersaTiles 설치](../guides/install_versatiles.ko.md)

준비된 맵 타일도 필요합니다: [지도 타일 다운로드](../guides/download_tiles.ko.md)

# 사용법

그런 다음 `versatiles`를 하위 명령 `server`와 함께 사용하여 서버를 시작하고, 간단히 versatiles 파일을 인수로 추가할 수 있습니다.
```bash
versatiles server planet.versatiles
```

## 여러 소스

두 개 이상의 소스를 제공하려면 간단히 추가할 수 있습니다.
```bash
versatiles server planet.versatiles satellite_imagery.mbtiles my_overlay.tar
```

서버가 시작되면 모든 소스와 해당 URL이 나열됩니다.
```
/tiles/planet/* <- /tiles/planet.versatiles
/tiles/satellite_imagery/* <- /tiles/satellite_imagery.mbtiles
/tiles/my_overlay/* <- /tiles/my_overlay.tar
```

각 소스는 확장자를 제외한 파일 이름과 동일한 URL을 받습니다. 다른 URL을 사용하려면 대괄호로 이 특수 표기법을 사용할 수 있습니다.
```bash
versatiles server "[osm]planet.versatiles" "[satellite]satellite_imagery.mbtiles" "[heatmap]my_overlay.tar"
```

이제 URL은 다음과 같습니다.
```
/tiles/osm/* <- /tiles/planet.versatiles
/tiles/satellite/* <- /tiles/satellite_imagery.mbtiles
/tiles/heatmap/* <- /tiles/my_overlay.tar
```

## 선택적 프런트엔드

선택적 프런트엔드로 VersaTiles 서버를 확장할 수 있습니다. 이 프런트엔드에는 최신 버전의 [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), 맵 스타일, 글꼴 및 기호가 포함되어 있습니다. [프론트엔드를 다운로드](../basics/frontend.md#download-the-frontend)할 수 있습니다.
```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar"
```

그런 다음 `-s` 인수와 함께 tar 파일을 추가하여 프런트엔드를 서버에 추가할 수 있습니다.

```bash
versatiles server -s frontend.br.tar planet.versatiles
```

## 다른 IP/포트

기본적으로 varietys는 127.0.0.1:8080을 사용합니다. IP/포트를 변경하려면 다음 옵션을 사용하세요.
- `-i`/`--ip`: 예: `-i 0.0.0.0`
- `-p`/`--port`: 예: `-p 3000`

# 포함되지 않은 것은 무엇인가요?

VersaTiles 서버는 프로젝트를 간단하고 유지 관리하기 쉽게 유지하기 위해 핵심 기능만 구현합니다. TLS 인증서와 캐싱은 포함되지 않습니다. 하지만 이를 위해 CDN이나 nginx를 사용할 수 있습니다. [문서](https://github.com/versatiles-org/versatiles-documentation)에서 CDN과 nginx에 대한 HowTo를 찾을 수 있습니다.

# 확장성 및 성능

VersaTiles 서버를 개발하는 데 사용된 프로그래밍 언어인 Rust는 성능과 낮은 리소스 소비로 유명합니다. 그 결과 VersaTiles 서버는 빠른 응답 시간을 유지하면서 많은 수의 동시 요청을 처리할 수 있습니다. 따라서 소규모 프로젝트에서 대규모 데이터 집약적 인프라에 이르기까지 다양한 애플리케이션에 이상적입니다.

# 구성 옵션

*구성 옵션을 설명해 주세요*

# API 문서

*API를 설명해 주세요*

# 프런트엔드 사용자 지정

*프런트엔드 설명*

# 업데이트 및 마이그레이션

*여기에 유용한 내용을 추가해 주세요*
