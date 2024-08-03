# 타일 다운로드 방법

## 직접 다운로드

공식 사이트 [download.versatiles.org](https://download.versatiles.org/)에서 전 세계 타일을 다운로드할 수 있습니다.

다운로드를 쉽게 하기 위해 `wget`을 사용할 수 있습니다. `-c` 플래그를 추가하여 중단된 다운로드를 재개할 수 있습니다:

```bash
wget -c "https://download.versatiles.org/osm.versatiles"
```

## 부분 다운로드

대륙이나 국가와 같이 특정 지역의 타일만 필요할 경우, VersaTiles를 사용하여 다운로드할 수 있습니다. 최소 및 최대 줌 레벨과 지리적 경계 상자를 지정하는 필터를 적용할 수 있습니다.

예를 들어, 스위스만 다운로드하려면 (경계에 3 타일 포함):
```bash
versatiles convert --bbox-border 3 --bbox "5.956,45.818,10.492,47.808" https://download.versatiles.org/osm.versatiles switzerland.versatiles
```

또는, 매우 유사하게, 독일을 다운로드하려면
```bash
versatiles convert --bbox-border 3 --bbox "5.988,47.302,15.017,54.983" https://download.versatiles.org/osm.versatiles germany.versatiles
```
~~~shell
versatiles convert --bbox-border 3 --bbox "5.988,47.302,15.017,54.983" --min-zoom 10 --max-zoom 14  https://download.versatiles.org/planet-latest.versatiles germany.versatiles
~~~

## Google Cloud Storage로 다운로드

VersaTiles 데이터를 Google Cloud Storage에 저장하려면 다음 단계를 따르세요:

- **Google Cloud Storage 버킷 준비**  
  [Google 문서](https://cloud.google.com/storage/docs/creating-buckets)를 따라 새 버킷을 만듭니다.

- **최신 데이터 복사**  
  [download.versatiles.org](https://download.versatiles.org/)에서 "osm.versatiles" 파일을 버킷으로 전송합니다. 세 가지 방법이 있습니다:

  1. **자동 전송**
      - "버킷 세부 정보"로 이동하여 "데이터 전송"을 클릭한 후 "데이터 전송 시작"을 선택합니다.
      - "소스 유형: URL 목록"을 선택하고 다음 단계로 진행합니다.
      - "URL 목록 파일의 URL"로 "https://download.versatiles.org/urllist.tsv"를 입력하고 진행합니다.
      - 대상 버킷과 폴더를 지정하고 계속 진행합니다.
      - "한 번 실행", "지금 시작"을 선택하고 "생성"을 클릭하여 마무리합니다.
      - 전송 상태는 [여기](https://console.cloud.google.com/transfer/jobs)에서 모니터링할 수 있습니다.
      - 참고: 전송 속도는 약 10 MB/s로 제한될 수 있습니다.

   2. **수동 전송**
      - 고속 인터넷 연결이 있는 경우 `wget` 또는 `curl`을 사용하여 파일을 다운로드하고 `gscloud`를 사용하여 업로드할 수 있습니다.

   3. **Google VM 전송**
      - 또는, Google Compute Engine VM을 사용하여 다운로드와 업로드를 모두 수행할 수 있습니다.

- **공개 액세스 설정**  
  버킷 또는 파일을 [공개 액세스](https://cloud.google.com/storage/docs/access-control/making-data-public)로 설정해야 합니다.
  <details><summary>공개 액세스가 필요한 이유</summary>
  VersaTiles는 현재 Google Cloud 인증을 지원하지 않습니다. 따라서, HTTPS를 통해 데이터를 검색하려면 공개 액세스가 필요합니다. 향후 버전에서는 Google Cloud Run의 자동 인증을 지원할 수 있습니다. 자세한 내용은 [issue versatiles-rs#22](https://github.com/versatiles-org/versatiles-rs/issues/22)를 참조하세요.</details>
