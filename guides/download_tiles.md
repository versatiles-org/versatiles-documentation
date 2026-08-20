# How to download tiles?

## Direct download

All tilesets are published at [download.versatiles.org](https://download.versatiles.org/). Every entry there has a **Download** button that builds the command for you: pick the whole planet or a bounding box, the container format (`.versatiles`, `.pmtiles`, `.mbtiles` or `.tar`), a zoom range, and whether to run the `versatiles` binary or Docker. Copy the generated command and run it.

The sections below explain the same commands, for when you would rather write them yourself.

To download a whole file directly, use `wget`. The `-c` flag resumes an interrupted download:

```bash
wget -c "https://download.versatiles.org/osm.versatiles"
```

Each file has `.md5` and `.sha256` companions to verify the download:

```bash
curl -O "https://download.versatiles.org/osm.versatiles.md5"
md5sum -c osm.versatiles.md5
```

### Older versions and update notifications

`osm.versatiles` always points at the newest build. Previous builds stay available under a dated name — `osm.20260608.versatiles` and so on — listed behind **Show all versions**. Pin one of those if you need a reproducible dataset.

Each tileset also publishes an RSS feed (for example [`feed-osm.xml`](https://download.versatiles.org/feed-osm.xml)) announcing new builds, and a `urllist_<tileset>.tsv` for scripted or bulk transfers.

## Partial download

If you only need tiles for a specific region, like a continent or a country, you can use VersaTiles to download them. Filters can be applied to specify minimum and maximum zoom levels, as well as a geographical bounding box.

For example, to download only tiles for Switzerland (including 3 tiles as border):

```bash
versatiles convert --bbox-border 3 --bbox "5.956,45.818,10.492,47.808" https://download.versatiles.org/osm.versatiles switzerland.versatiles
```

Or, very similarly, how to download Germany

```bash
versatiles convert --bbox-border 3 --bbox "5.988,47.302,15.017,54.983" https://download.versatiles.org/osm.versatiles germany.versatiles
```

You can also limit the zoom levels:

```bash
versatiles convert --bbox-border 3 --bbox "5.988,47.302,15.017,54.983" --min-zoom 10 --max-zoom 14 https://download.versatiles.org/osm.versatiles germany.versatiles
```

## Downloading to Google Cloud Storage

To store VersaTiles data on Google Cloud Storage, follow these steps:

- **Prepare a Google Cloud Storage Bucket**
  Follow the [Google documentation](https://cloud.google.com/storage/docs/creating-buckets) to create a new bucket.

- **Copy the Latest Data**
  Transfer "osm.versatiles" file from [download.versatiles.org](https://download.versatiles.org/) to your bucket. There are 3 ways to do that:
  1. **Automated Transfer**
  - Navigate to "Bucket details" and click on "TRANSFER DATA", then "Transfer data in".
  - Select "Source type: URL list" and proceed to the next step.
  - Enter "https://download.versatiles.org/urllist_osm.tsv" as the "URL of TSV file" and proceed.
  - Specify your bucket and folder as the destination, and continue.
  - Opt for "Run once", "Starting now", and finalize by clicking "CREATE".
  - Monitor the transfer status [here](https://console.cloud.google.com/transfer/jobs).
  - Note: Transfer speed may be limited to around 10 MB/s for unspecified reasons.
  2.  **Manual Transfer**
  - Use `wget` or `curl` to download the file and [`gcloud storage cp`](https://cloud.google.com/sdk/gcloud/reference/storage/cp) to upload it, if you have a high-speed internet connection.
  3.  **Google VM Transfer**
  - Alternatively, use a Google Compute Engine VM for both downloading and uploading.

- **Set Public Access**
  The bucket or the file must be set to [public access](https://cloud.google.com/storage/docs/access-control/making-data-public).
  <details><summary>Why Public Access is Required</summary>
  The Rust server reads containers over HTTP, HTTPS and SFTP only — it has no Google Cloud authentication, so it can only reach a bucket object that is publicly readable over HTTPS.
  If you would rather keep the bucket private, use <a href="https://github.com/versatiles-org/node-versatiles-google-cloud">@versatiles/google-cloud</a> instead: that Node.js server takes the bucket name as an argument and reads it with the service account's own credentials, so nothing has to be public.</details>
