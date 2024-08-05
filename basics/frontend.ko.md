# VersaTiles 프론트엔드

서버에서는 벡터 타일에 대한 정보만 제공합니다. 그러나 대화형 웹 맵에는 더 많은 것들이 필요합니다.
- 로딩, 그리기 및 사용자 상호작용을 처리하는 [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js)와 같은 JavaScript 라이브러리.
- 벡터 타일을 그리는 방법을 정의하는 스타일.
- 맵의 레이블 및 마커에 대한 글꼴 및 기호.

`versatiles`를 더욱 쉽게 사용할 수 있도록 모든 것이 컴팩트한 패키지로 준비되었습니다.

## 프론트엔드 Tarball 패키지

[Release 페이지](https://github.com/versatiles-org/versatiles-frontend/releases/latest)에서 프론트엔드 전체 파일을 tarball로 제공합니다.  

아래 명령어는 `frontend.tar.gz` 파일을 현재 디렉토리로 다운로드하고 `frontend.d` 디렉토리에 압축 해제합니다
```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.tar.gz"
mkdir -p frontend.d && tar -zxvf frontend.tar.gz -C frontend.d
```

### 압축 해제된 파일을 사용하여 `versatiles` 실행

아래 명령어는 `-s` 또는 `--static` 옵션으로  `frontend.d` 디렉토리의 정적 파일을 제공합니다.
```bash
versatiles osm.versatiles --static frontend.d
```

## 프론트엔드 Brotli 패키지

Brotli로 압축된 파일을 사용하면 서버의 CPU 부하를 줄이고 성능을 최적화할 수 있습니다.  

이 명령어는 `frontend.br.tar` 파일을 현재 디렉토리로 다운로드합니다.

```bash
wget "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar"
```

### Brotli 압축 파일을 사용하여 `versatiles` 실행

아래 명령어는 `-s` 또는 `--static` 옵션으로 `frontend.br.tar` 파일에 포함된 정적 파일을 제공합니다.
```sh
versatiles osm.versatiles --static frontend.br.tar
```




## 어떻게 빌드하나요?

우리는 [versatiles-frontend](https://github.com/versatiles-org/versatiles-frontend) Repo에서 프론트엔드를 유지 관리합니다. GitHub 워크플로가 빌드 스크립트를 실행합니다.
- [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js)의 최신 버전
- 리포지토리의 스타일 및 스프라이트: [versatiles-styles](https://github.com/versatiles-org/versatiles-styles)
- 리포지토리의 글꼴(글리프): [versatiles-fonts](https://github.com/versatiles-org/versatiles-fonts)

더욱 쉬운 배포를 위하여 TAR 내부의 모든 파일을 brotli로 사전 압축했습니다. 그래서 패키지에 특이한 파일 확장자 `.br.tar`가 있습니다. 순서를 `.tar.br`로 변경하는 것은 잘못된 것입니다. TAR 컨테이너 자체는 압축되지 않았기 때문입니다.
