# How to run a VersaTiles service in Google Cloud Run?

## 1. Create a Google Bucket

See also the [Google documentation: Create buckets](https://cloud.google.com/storage/docs/creating-buckets).

## 2. Upload the VersaTiles planet to your bucket

See also the [How to transfer the VersaTiles planet to Google Cloud Storage](../guides/download_tiles.md).

## 3. Create a Git Repo with a `Dockerfile`

- Create an empty Git repository.
- Add a file with the filename "Dockerfile" with the following content:

```Dockerfile
# Use the latest docker image of VersaTiles including the frontend.
FROM versatiles/versatiles-frontend:latest-alpine

EXPOSE 8080

# Google Cloud Run injects $PORT at runtime. A shell wrapper is required so
# the variable is expanded before the server starts.
#   "[osm]https://..." is the URL of the VersaTiles container in your bucket.
#      - make sure the file is publicly accessible
#      - "[osm]" sets the name of the tile source (change to taste)
#      - append more entries to serve multiple tile sources
ENTRYPOINT []
CMD ["sh", "-c", "exec versatiles serve -p \"${PORT:-8080}\" '[osm]https://storage.googleapis.com/bucket_name/folder_name/planet_???.versatiles'"]
```

- Don't forget to update the last line of `Dockerfile` to point to your Google Bucket
- Commit and push the new "Dockerfile"

## 4. Create a Google Cloud Run Service

- Go to [Google Cloud Run](https://console.cloud.google.com/run)
- Create a [new service](https://console.cloud.google.com/run/create)
  - Select "Continuously deploy new revisions from a source repository".
  - Click on "SET UP CLOUD BUILD". A Popup appears:
    - "Source repository": Select you repository containing the `Dockerfile`. If you can't find your repository you have to "Manage connected repositories". Click "NEXT".
    - "Branch" is "^main$", for "Build type" select "Dockerfile". Click "SAVE".
  - Now you can choose "Service name" and "Region"
  - "Allow direct access to your service from the Internet"
  - For "Authentication" select "Allow unauthenticated invocations".
  - When finished click button "CREATE".
- Check if the service is running correctly: Open the link in "Service details" (something like: https://\*\*\*.run.app). You should see an interactive map.

## 5. Add a load balancer

- Add a domain/subdomain, point it to an IP. (better: IPv4+IPv6)
- Use these IPs as frontend for a load balancer.
- Backend is a "serverless network endpoint group". Point it to your Cloud Run Service.
- Activate the CDN in the backend.
