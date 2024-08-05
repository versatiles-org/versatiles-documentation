# VersaTiles 실행

`versatiles`의 주요 구성 요소와 기능을 살펴봅니다.

# 파일 형식

VersaTiles의 핵심 개념 중 하나는 맵 데이터를 저장하기 위한 고유한 [.versatiles 파일 형식](https://github.com/versatiles-org/versatiles-spec)입니다. 이 형식은 행성 전체의 모든 맵 타일을 포함할 뿐만 아니라 파일 내에서 해당 바이트 오프셋과 길이를 포함한 모든 맵 타일의 인덱스도 포함합니다.

.versatiles 형식의 진짜 매력은 로컬에 저장할 필요가 없다는 것입니다. 대신 예를 들어 HTTP를 사용하여 원격으로 액세스할 수 있습니다. 이는 `versatiles`가 필요한 맵 타일 데이터가 포함된 .versatiles 파일의 특정 부분을 검색할 수 있도록 하는 HTTP 바이트 범위 요청 덕분에 가능합니다. 이 기능을 사용하면 `versatiles`는 전체 .versatiles 파일을 로컬에 두지 않고도 맵 타일을 효율적으로 제공할 수 있습니다. 이를 통해 VersaTiles로 확장 가능한 맵 인프라를 훨씬 더 쉽게 구축할 수 있습니다.

HTTP 바이트 범위 요청을 통해 액세스할 수 있는 컨테이너를 개발한다는 아이디어는 [COMTiles](https://github.com/mactrem/com-tiles) 및 [PMTiles](https://github.com/protomaps/PMTiles)를 기반으로 합니다. 그러나 우리는 약간 다른 부분에 초점을 맞추고, 필요한 경우 이전 구현에서 벗어나야 할 필요성을 느꼈기 때문에 자체 표준을 개발하기로 결정했습니다. 그러나 우리는 파이프라인에서 대안으로 COMTiles 및 PMTiles를 지원하는 데 매우 열려 있습니다.

# 설치 및 설정

* VersaTiles를 설치해야 합니다: [VersaTiles 설치](../guides/install_versatiles.ko.md)  
* VersaTiles 실행을 위하여 행성 전체, 또는 일부를 포함한 벡터 타일이 필요합니다: [VersaTiles 벡터 타일 다운로드](../guides/download_tiles.ko.md)

# 사용법


## 서버 시작 및 기본 사용

 * **서버 시작**: `versatiles server` 명령어를 사용하여 서버를 시작합니다. 기본적인 사용 방법은 다음과 같습니다.  
    
    ```bash
    versatiles server osm.versatiles
    ```
    
    이 명령어는 `osm.versatiles` 파일을 소스로 사용하여 서버를 시작합니다.

* **두 개 이상의 소스**: 파일 이름을 나열하는 방법으로 서버에 두 개 이상의 소스를 추가할 수 있습니다.
 
     ```bash
     versatiles server osm.versatiles satellite_imagery.mbtiles my_overlay.tar
     ```
     위 예는 `osm.versatiles`, `satellite_imagery.mbtiles`, `my_overlay.tar`의 세 가지 소스를 서버에 추가합니다.

  서버가 시작되면 *각 소스의 파일 이름에서 확장자를 제외한 부분*이 URL 경로로 자동 매핑됩니다.
     - `/tiles/osm/*` <- `osm.versatiles`
     - `/tiles/satellite_imagery/*` <- `satellite_imagery.mbtiles`
     - `/tiles/my_overlay/*` <- `my_overlay.tar`

## 사용자 정의 URL

- **URL 사용자 정의**: 기본 URL 경로 대신 사용자 정의 URL을 설정할 수 있습니다. 이때 대괄호를 사용하여 소스와 URL을 매핑합니다.
  
    ```bash
    versatiles server "[planet]osm.versatiles" "[satellite]satellite_imagery.mbtiles" "[heatmap]my_overlay.tar"
    ```
    URL 매핑은 다음과 같이 변경됩니다:
    - `/tiles/planet/*` <- `osm.versatiles`
    - `/tiles/satellite/*` <- `satellite_imagery.mbtiles`
    - `/tiles/heatmap/*` <- `my_overlay.tar`

## 다른 IP/포트
`versatiles`는 기본적으로 `127.0.0.1:8080`을 사용합니다. 아래 옵션을 사용하여 IP 주소와 포트 번호를 변경할 수 있습니다.

* **IP 주소 변경**: 여러 IP 대역을 사용하는 경우 `-i` 또는 `--ip` 옵션을 사용하여 IP 주소를 지정합니다.
  
     ```bash
     versatiles server --ip 0.0.0.0
     ```

* **포트 번호 변경**: 다른 포트 번호를 사용하려면 `-p` 또는 `--port` 옵션을 사용하여 포트 번호를 지정합니다.

     ```bash
     versatiles server --port 80
     ```

## 프론트엔드

최신 버전의 [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js), 맵 스타일, 글꼴 및 기호를 포함한 프론트엔드를 선택적으로 사용할 수 있습니다: [VersaTile 프론트엔드](../basics/frontend.ko.md)  

```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar"
versatiles osm.versatiles --static frontend.br.tar
```

# 포함되지 않은 것은 무엇인가요?

`versatiles`는 프로젝트의 간단하고 빠른 유지 관리를 위하여 핵심 기능만 구현하였습니다. TLS 인증서와 캐싱 기능은 서버에 포함되지 않습니다. 하지만 대안으로 CDN 또는 Nginx를 사용할 수 있습니다. [문서](https://github.com/versatiles-org/versatiles-documentation)에서 CDN과 nginx에 대한 HowTo를 찾을 수 있습니다.

# 확장성 및 성능

Rust로 작성되어 리소스 사용량이 적으면서도 뛰어난 성능을 제공하는 `versatiles`는 빠른 응답 시간을 유지하면서 많은 수의 동시 요청을 처리할 수 있습니다. 따라서 소규모 프로젝트에서 대규모 데이터 집약적 인프라에 이르기까지 다양한 애플리케이션에 이상적입니다.

# 구성 옵션

*구성 옵션을 설명해 주세요*

# API 문서

*API를 설명해 주세요*

# 프런트엔드 사용자 지정

*프런트엔드 설명*

# 업데이트 및 마이그레이션

*여기에 유용한 내용을 추가해 주세요*
