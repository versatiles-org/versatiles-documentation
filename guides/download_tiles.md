# How to download tiles?

## Direct download

You can download tiles for the whole planet from the official site [download.versatiles.org](https://download.versatiles.org/).

To make downloading easier, you can use `wget`. The `-c` flag can be added to resume an interrupted download:

```bash
wget -c "https://download.versatiles.org/osm.versatiles"
```

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
~~~shell
versatiles convert --bbox-border 3 --bbox "5.988,47.302,15.017,54.983" --min-zoom 10 --max-zoom 14  https://download.versatiles.org/planet-latest.versatiles germany.versatiles
~~~

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

   2. **Manual Transfer**
    - Use `wget` or `curl` to download the file and `gscloud` to upload it, if you have a high-speed internet connection.

   3. **Google VM Transfer**
    - Alternatively, use a Google Compute Engine VM for both downloading and uploading.

- **Set Public Access**  
  The bucket or the file must be set to [public access](https://cloud.google.com/storage/docs/access-control/making-data-public).
  <details><summary>Why Public Access is Required</summary>
  VersaTiles currently does not support Google Cloud authentication. Therefore, public access is necessary for HTTPS retrieval. Future versions may include support for Google Cloud Run's automatic authentication. For more details, refer to [issue versatiles-rs#22](https://github.com/versatiles-org/versatiles-rs/issues/22).</details>
