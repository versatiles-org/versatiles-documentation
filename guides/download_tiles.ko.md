# 타일 다운로드 방법

- [개인 서버로 다운로드](#개인-서버로-다운로드)
  - [전체 다운로드](#전체-다운로드)
  - [부분 다운로드](#부분-다운로드)
- [Google Cloud Storage로 다운로드](#google-cloud-storage로-다운로드)

## 개인 서버로 다운로드
### 전체 다운로드

[download.versatiles.org](https://download.versatiles.org/)에서 전 세계 타일을 다운로드할 수 있습니다.

```bash
wget -c "https://download.versatiles.org/osm.versatiles"
```

- `-c`: 다운로드가 중간에 중단되었을 경우 이어서 다운로드합니다.
- `"https://download.versatiles.org/osm.versatiles"`: 다운로드할 파일의 URL입니다.

이 명령어를 실행하면 `osm.versatiles` 파일을 현재 디렉토리에 다운로드합니다.

### 부분 다운로드

대륙이나 국가와 같이 특정 지역의 타일만 필요할 경우, `versatiles convert`를 사용하여 다운로드할 수 있습니다. 최소 및 최대 줌 레벨과 지리적 경계 상자를 지정하는 필터를 적용할 수 있습니다.

#### `versatiles convert` 명령어 사용법

`versatiles convert` 명령어는 특정 지역의 타일을 분리하여 다운로드할 때 사용합니다. 기본 사용법은 다음과 같습니다:

```bash
versatiles convert [옵션] [소스 URL] [대상 파일명]
```
#### 옵션 설명

- `--bbox`: 다운로드할 지역의 경계 상자를 지정합니다. 값은 서경, 남위, 동경, 북위의 순서로 입력합니다.
- `--bbox-border`: 경계 상자에 추가할 타일 수를 지정합니다. 경계에서 추가로 포함할 타일의 수를 설정합니다.
- `--min-zoom`: 다운로드할 최소 줌 레벨을 지정합니다. 이 값이 낮을수록 더 넓은 영역을 포함합니다.
- `--max-zoom`: 다운로드할 최대 줌 레벨을 지정합니다. 이 값이 높을수록 더 세밀한 정보를 포함합니다.

#### 예시

다음은 스위스 지역의 타일을 다운로드하는 예시입니다:

```bash
versatiles convert --bbox-border 3 --bbox "5.956,45.818,10.492,47.808" https://download.versatiles.org/osm.versatiles switzerland.versatiles
```

- `--bbox-border 3`: 경계에 3 타일을 포함합니다.
- `--bbox "5.956,45.818,10.492,47.808"`: 다운로드할 지역의 경계 상자입니다.
- `https://download.versatiles.org/osm.versatiles`: 소스 파일의 URL입니다.
- `switzerland.versatiles`: 생성될 대상 파일명입니다.

이 명령어를 실행하면 지정된 경계 상자 내의 타일을 다운로드하여 `switzerland.versatiles` 파일로 저장합니다.

- - -

## Google Cloud Storage로 다운로드

VersaTiles 데이터를 Google Cloud Storage에 저장하려면 다음 단계를 따르세요:

- **Google Cloud Storage 버킷 준비**  
  [Google 문서](https://cloud.google.com/storage/docs/creating-buckets)를 따라 새 버킷을 만듭니다.

- **최신 데이터 복사**  
  [download.versatiles.org](https://download.versatiles.org/)에서 `osm.versatiles` 파일을 버킷으로 전송합니다.
    
  세 가지 방법이 있습니다:

  1. **자동 전송**
      - **버킷 세부정보**로 이동하여 **데이터 전송**을 클릭한 후 **데이터 전송 시작**을 선택합니다.
      - **소스 유형: URL 목록**을 선택하고 다음 단계로 진행합니다.
      - **URL 목록 파일**의 URL로 `https://download.versatiles.org/urllist_osm.tsv`를 입력하고 진행합니다.
      - 대상 버킷과 폴더를 선택하면 **한 번 실행**, **지금 시작**을 선택하고 **생성**을 클릭하여 마무리합니다.

   2. **수동 전송**
      - `wget` 또는 `versatiles convert`를 사용하여 전 세계 또는 특정 지역의 타일을 클라이언트에 다운로드할 수 있습니다.
      - 버킷에 임의로 파일을 업로드합니다: [파일 시스템에서 Google 클라우드로 업로드](https://cloud.google.com/storage/docs/uploading-objects?hl=ko#upload-object-cli)

   3. **Google VM 전송**
      - Google Compute Engine VM을 사용하여 다운로드와 업로드를 모두 수행할 수 있습니다.

- **공개 액세스 설정**  
  버킷 또는 파일을 [공개 액세스](https://cloud.google.com/storage/docs/access-control/making-data-public)로 설정해야 합니다.
  <details><summary>공개 액세스가 필요한 이유</summary>
  VersaTiles는 현재 Google Cloud 인증을 지원하지 않습니다. 따라서, HTTPS를 통해 데이터를 검색하려면 공개 액세스가 필요합니다.
  향후 버전에서는 Google Cloud Run의 자동 인증을 지원할 수 있습니다. 자세한 내용은 [issue versatiles-rs#22](https://github.com/versatiles-org/versatiles-rs/issues/22) 를 참조하세요.
  </details>
