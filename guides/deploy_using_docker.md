# Deploy a VersaTiles Server Behind Nginx (Docker)

This guide explains how to run a VersaTiles server behind an **Nginx reverse‑proxy** using Docker.  
The setup lets you serve map tiles under your own domain with HTTPS and caching.

> [!TIP]
> If you only need a quick local test server, see **[Run a VersaTiles server locally](./local_server_docker.md)** instead.

---

## Prerequisites

| Requirement               | Notes                                                                       |
|---------------------------|-----------------------------------------------------------------------------|
| **Docker** 20.10 or newer | Make sure the daemon is running.                                            |
| A **domain name**         | Configure an A/AAAA record that points to the host where Docker is running. |
| Port **80 / 443** open    | Needed for HTTP‑01 ACME validation and HTTPS traffic.                       |

---

## Image Overview

The image **`versatiles-nginx`** combines:

| Component                                                                                                | Purpose                                                           |
|----------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------|
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
  -e TILE_SOURCES=osm.versatiles \
  -e BBOX="9.5,46.3,17.2,49.1" \
  versatiles/versatiles-nginx:latest
```

See the [versatiles-nginx/README.md](https://github.com/versatiles-org/versatiles-docker/blob/main/versatiles-nginx/README.md)

You can also use our ["Setup Server" tool](https://versatiles.org/tools/setup_server#linux+docker_nginx) to generate a Bash command.
