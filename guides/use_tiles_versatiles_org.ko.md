이 문서는 [English/영어](use_tiles_versatiles_org.md)와 [Korean/한국어](use_tiles_versatiles_org.ko.md)로 제공됩니다.

# 공개된 타일 서버 사용하기

저희는 [tiles.versatiles.org](https://tiles.versatiles.org)에서 공개된 무료 벡터 타일 서버를 운영합니다.

`https://tiles.versatiles.org/tiles/osm/{z}/{x}/{y}` URL 패턴으로 타일에 직접 액세스할 수 있습니다.

타일, 글꼴, 아이콘에 대한 모든 URL이 포함되어 있는 사전 빌드된 스타일 중 하나를 사용할 수도 있습니다: [VersaTiles Style](https://github.com/versatiles-org/versatiles-style/releases/latest/)

아래는 인터랙티브 맵을 위한 오픈소스 라이브러리인 Maplibre를 사용하여 맵을 구현하는 방법을 보여주는 HTML 예제입니다.

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>VersaTiles - Demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://tiles.versatiles.org/assets/lib/maplibre-gl/maplibre-gl.js"></script>
    <link
      href="https://tiles.versatiles.org/assets/lib/maplibre-gl/maplibre-gl.css"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="map" style="width: 100%; height: 80vh;"></div>
    <script>
      new maplibregl.Map({
        container: 'map', // The container ID
        style: 'https://tiles.versatiles.org/assets/styles/colorful/style.json', // Style URL
      });
    </script>
  </body>
</html>
```
