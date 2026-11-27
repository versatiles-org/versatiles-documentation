# Deploy a VersaTiles Server Behind Nginx (Docker)

This guide explains how to run a VersaTiles server behind an **Nginx reverse proxy** using Docker.  
The setup lets you serve map tiles under your own domain with HTTPS and caching.

> [!TIP]
> If you only need a quick local test server, see **[Run a VersaTiles server locally](./local_server_docker.md)** instead.

---

## Prerequisites

| Requirement               | Notes                                                                       |
| ------------------------- | --------------------------------------------------------------------------- |
| **Docker** 20.10 or newer | Make sure the daemon is running.                                            |
| A **domain name**         | Configure an A/AAAA record that points to the host where Docker is running. |
| Port **80 / 443** open    | Needed for HTTP‑01 ACME validation and HTTPS traffic.                       |

---

## Image Overview

The image **`versatiles-nginx`** combines:

| Component                                                                                                | Purpose                                                           |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [VersaTiles](https://github.com/versatiles-org/versatiles-rs)                                            | Tile server.                                                      |
| [Nginx](https://github.com/nginx/nginx)                                                                  | Reverse‑proxy, HTTP/2, caching.                                   |
| [Certbot](https://github.com/certbot/certbot)                                                            | Automatic Let’s Encrypt certificates & renewal.                   |
| [Helper scripts](https://github.com/versatiles-org/versatiles-docker/tree/main/versatiles-nginx/scripts) | Pull missing tile data / front‑ends and wire everything together. |

**Key features**

- Serves map data over **HTTPS** with automatic certificate renewal.
- Caches and compresses requests - **up to ~5 000 req/s per core**.
- Fetches front‑end bundles and tile archives on first run.

## Usage

Example:

```bash
docker run -d --name versatiles \
  -p 80:80 -p 443:443 \
  -v "$(pwd)/data:/data" \
  -e DOMAIN=maps.example.com \
  -e EMAIL=admin@example.com \
  -e FRONTEND=standard \
  -e TILE_SOURCES=osm-vector.versatiles \
  -e BBOX="9.5,46.3,17.2,49.1" \
  versatiles/versatiles-nginx:latest
```

See the [versatiles-nginx/README.md](https://github.com/versatiles-org/versatiles-docker/blob/main/versatiles-nginx/README.md)

You can also use our ["Setup Server" tool](https://versatiles.org/tools/setup_server#linux+docker_nginx) to generate a Bash command.

## Keeping it up to date

`versatiles-nginx` faces the internet, and nginx, OpenSSL and certbot in it get security fixes regularly. We rebuild the image with the newest packages:

- on the day Alpine Linux publishes updates for it,
- every Thursday,
- and with every VersaTiles release.

A rebuild keeps the same tags (`latest` and the version). Your server only gets it when you pull the image again and replace the container. Tile data, front-ends and certificates are in `/data`, so they are kept.

To update by hand:

```bash
docker pull versatiles/versatiles-nginx:latest
docker rm -f versatiles
# then run the same `docker run` command as above again
```

The server is unreachable while the new container starts.

To update automatically, put the `docker run` command into a script that replaces the container only when a newer image arrived, and run it daily from cron. For example `/usr/local/bin/update-versatiles.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
image=versatiles/versatiles-nginx:latest

running=$(docker inspect -f '{{.Image}}' versatiles 2>/dev/null || true)
docker pull -q "$image" >/dev/null
if [ "$(docker image inspect -f '{{.Id}}' "$image")" = "$running" ]; then
  exit 0 # up to date
fi

docker rm -f versatiles >/dev/null 2>&1 || true
docker run -d --name versatiles \
  -p 80:80 -p 443:443 \
  -v "/srv/versatiles/data:/data" \
  -e DOMAIN=maps.example.com \
  -e EMAIL=admin@example.com \
  -e FRONTEND=standard \
  -e TILE_SOURCES=osm-vector.versatiles \
  -e BBOX="9.5,46.3,17.2,49.1" \
  "$image"
```

Use your own values, and an absolute path for the data folder: cron doesn't run in the folder you set it up in. Then make the script executable and add it to root's crontab, here at 4:30 every night:

```bash
sudo chmod +x /usr/local/bin/update-versatiles.sh
(sudo crontab -l 2>/dev/null; echo "30 4 * * * /usr/local/bin/update-versatiles.sh") | sudo crontab -
```

nginx publishes its security advisories at [nginx.org/en/security_advisories.html](https://nginx.org/en/security_advisories.html).
