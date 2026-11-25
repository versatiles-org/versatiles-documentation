# How to use geocode.versatiles.org

We run [geocode.versatiles.org](https://geocode.versatiles.org/status) as a free demo geocoder next to [tiles.versatiles.org](use_tiles_versatiles_org.md). It turns place names and addresses into coordinates, and coordinates back into addresses, for the whole planet and in many languages.

It is a [Photon](https://github.com/komoot/photon) server, version 1.x, with the worldwide OpenStreetMap index. The address search in the VersaTiles frontend and in the [map editor](https://versatiles.org/versatiles-map-editor/) uses it. It comes without guarantees: see [What to expect](#what-to-expect) before you build on it.

The [terms of use](https://versatiles.org/terms/) say what we ask in return. Above all: if your company uses geocode.versatiles.org instead of a commercial geocoder, our recommendation is to donate 20% of what you save.

## Endpoints

| Endpoint      | What it does                                                         |
| ------------- | -------------------------------------------------------------------- |
| `/api`        | Search by free text: `?q=brandenburger tor`                          |
| `/structured` | Search by address parts: `?city=Berlin&street=Pariser Platz`         |
| `/reverse`    | Find what is at a coordinate: `?lat=52.5163&lon=13.3777`             |
| `/status`     | Server status and the date of the index, never answered from a cache |

Every answer is a GeoJSON `FeatureCollection`: each feature is a point, with the address parts, the OSM key and value and the OSM id in its properties.

```bash
curl "https://geocode.versatiles.org/api?q=brandenburger%20tor&limit=1"
```

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "osm_type": "W",
        "osm_id": 518071791,
        "osm_key": "tourism",
        "osm_value": "attraction",
        "type": "house",
        "name": "Brandenburger Tor",
        "housenumber": "1",
        "street": "Pariser Platz",
        "district": "Mitte",
        "city": "Berlin",
        "postcode": "10117",
        "country": "Germany",
        "countrycode": "DE",
        "extent": [13.3775798, 52.5164328, 13.3778251, 52.516117]
      },
      "geometry": { "type": "Point", "coordinates": [13.3777034, 52.5162699] }
    }
  ]
}
```

## Parameters

The most useful ones; [Photon's API documentation](https://github.com/komoot/photon/blob/master/docs/api-v1.md) has all of them.

| Parameter                     | Endpoints             | Meaning                                                                                                                                |
| ----------------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `q`                           | `/api`                | The search text.                                                                                                                       |
| `limit`                       | all                   | Number of results. This server returns at most 20.                                                                                     |
| `lang`                        | all                   | Language of the names, e.g. `de`. Without it, the browser's `Accept-Language` header decides, then English.                            |
| `lat`, `lon`                  | `/api`, `/reverse`    | For `/api`: prefer results near this point. For `/reverse`: the point to look up.                                                      |
| `zoom`, `location_bias_scale` | `/api`                | How far around `lat`/`lon` to prefer results, and how much a place's importance still counts.                                          |
| `bbox`                        | `/api`, `/structured` | Only results within `minLon,minLat,maxLon,maxLat`.                                                                                     |
| `countrycode`                 | `/api`, `/structured` | Only results in this country (ISO 3166-1 alpha-2, may be repeated).                                                                    |
| `layer`                       | all                   | Only these kinds of places: `house`, `street`, `locality`, `district`, `city`, `county`, `state`, `country`, `other`. May be repeated. |
| `radius`                      | `/reverse`            | Search radius in kilometres.                                                                                                           |

For a search box, send `lat`, `lon` and `zoom` from the current map view: results near what the user is looking at then come first.

## Use it in a web map

The server sends `Access-Control-Allow-Origin: *` on every response, so a browser can call it from any website:

```js
const url = new URL('https://geocode.versatiles.org/api');
url.searchParams.set('q', 'Kölner Dom');
url.searchParams.set('limit', '5');
const { features } = await fetch(url).then((r) => r.json());
map.flyTo({ center: features[0].geometry.coordinates, zoom: 16 });
```

For a complete search box, the playground's [address search example](https://versatiles.org/playground/geocoder/) connects the server to the [`maplibre-gl-geocoder`](https://maplibre.org/maplibre-gl-geocoder/) plugin for MapLibre GL JS.

## Attribution

The results come from [OpenStreetMap](https://www.openstreetmap.org/copyright) and are available under the Open Database License. If you show them, credit "© OpenStreetMap contributors". On a map with one of our styles this credit is already shown. The index is built by [GraphHopper](https://www.graphhopper.com/) for Photon.

## What to expect

### Freshness

The index is not updated automatically. `/status` gives its date as `import_date`:

```bash
curl https://geocode.versatiles.org/status
# {"status":"Ok","import_date":"2026-11-15T00:02:21Z","version":"1.3.0",...}
```

A place added to OpenStreetMap after that date can't be found yet.

### Caching

Answers are cached for 7 days, as they change only with a new index. The `X-Cache-Status` header says whether an answer came from the cache (`HIT`) or from Photon (`MISS`).

While the index is being replaced, which takes about an hour, only searches already in the cache are answered. New ones fail with `502`.

### Rate limit

Each client address may send 5 requests per second, with a burst of 30. That is enough for a search box that searches while the user types. Beyond it, the server answers `429 Too Many Requests` with a `Retry-After` header: wait at least that many seconds before trying again.

For a search box, wait about 200 ms after the last keystroke before you send a request, as `maplibre-gl-geocoder` does by default. Don't use the server to geocode large lists of addresses; run your own instance for that (see below).

### Privacy

The server logs requests without the search text and with anonymised addresses: the last part of an IPv4 address is set to zero, and an IPv6 address is cut to its first 32 bits. We use the logs only to find problems and obvious misuse.

### Availability

It is a single small server with no redundancy. If your project depends on a geocoder, run your own.

## Run your own geocoder

There is no official Photon Docker image, so we publish the one this server uses as `ghcr.io/versatiles-org/photon`, for amd64 and arm64. It needs an index. GraphHopper publishes [ready-made ones](https://download1.graphhopper.com/public/) for the planet (`photon-db-planet-1.0-latest.tar.bz2`: about 63 GB, 92 GB unpacked) and for single continents and countries. Photon 1.x needs one marked `1.0`. Unpack it into a folder, for example:

```bash
mkdir -p /path/to/index
curl -L https://download1.graphhopper.com/public/photon-db-planet-1.0-latest.tar.bz2 \
    | lbzip2 -d | tar -x -C /path/to/index
```

Then start Photon on that folder:

```bash
docker run -d -p 2322:2322 -v /path/to/index:/photon/data \
    ghcr.io/versatiles-org/photon:1.3.0 -cors-any
```

Then use `http://localhost:2322/api?q=…` in place of `https://geocode.versatiles.org/api?q=…`.

For production, the [photon-stack](https://github.com/versatiles-org/photon-stack) repository has the complete setup of geocode.versatiles.org: Docker Compose with nginx for TLS, caching and rate limiting, certificate renewal, index updates, and what matters for performance with an index larger than the server's RAM.
