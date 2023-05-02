# How to upload the VersaTiles planet to Google Cloud Storage

- Prepare a Google Cloud Storage bucket. See also the [Google documentation](https://cloud.google.com/storage/docs/creating-buckets).
- Copy the newest version of "planet-*.versatiles" from [download.versatiles.org](https://download.versatiles.org/) into your bucket. There are 3 ways to do that:

  1. Using "Transfer data in":
     - In "Bucket details" click on "TRANDFER DATA", "Transfer data in".
     - Select "Source type: URL list" and click on "NEXT STEP".
     - As "URL of TSV file" set: "https://raw.githubusercontent.com/versatiles-org/versatiles-documentation/main/assets/urllist.tsv" and click on "NEXT STEP".
     - Choose a bucket and folder as destination and click on "NEXT STEP".
     - "Run once", "Starting now" and click on "NEXT STEP".
     - Click on "CREATE".
     - This will start the transfer. You can monitor the transfer also in [transfer jobs](https://console.cloud.google.com/transfer/jobs).
     - For unknown reasons, Google transfers the data at a speed of only an annoying 10 MB/s.

  2. Manually:
     - If you have a fast internet connection at home/work, you can download the file manually with wget/curl and upload it with gscloud.

  3. Manually in a Google VM:
     - You could also use a Google Compute Engine VM to download and upload the file.

- Either the bucket or the file must be [publicly accessible](https://cloud.google.com/storage/docs/access-control/making-data-public).
	<details><summary>Explanation</summary>
   In the current version of VersaTiles, Google authentication is not yet implemented. Therefore, either the entire bucket or the file must be publicly accessible to enable access via HTTPS.
	
	Hopefully, in the near future, the possibility of specifying gs:// addresses as a source will also be implemented VersaTiles in order to be able to use the automatic Google Cloud authentication in Google Cloud Run. Also see [issue versatiles-rs#22](https://github.com/versatiles-org/versatiles-rs/issues/22).
  </details>
