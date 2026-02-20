You can read this document in [English/영어](README.md) or [Korean/한국어](README.ko.md).

---

**VersaTiles** is an open-source ecosystem for generating, processing, storing, serving and rendering [map tiles](basics/web_maps.md).
It provides a open, modular and high-performance alternative to proprietary solutions, offering full control over the map data pipeline.
It enables developers and organizations to self-host and serve map tiles without relying on commercial providers.
[Learn more](basics/versatiles.md)

## Why Use VersaTiles?

- **Optimized Performance** – The VersaTiles container format ensures **fast** and **efficient** tile access.
- **Modular & Flexible** – Can be used as a complete system or integrated with existing map solutions.
- **Self-Hosting & Control** – Run your own map infrastructure without third-party dependencies.
- **Fully Open-Source** – No proprietary restrictions or licensing fees.

Whether you need a **fully self-hosted map solution**, a **faster alternative to `.mbtiles`**, or a **customizable
vector tile pipeline**, VersaTiles provides the tools to build and serve modern, high-performance maps.

## VersaTiles components

The VersaTiles ecosystem consists of several components, each playing a role in the **end-to-end map tile workflow**:

### Tile Generation and Processing

- **[VersaTiles Generator](https://github.com/versatiles-org/versatiles-generator)**: Converts [OpenStreetMap](https://www.openstreetmap.org/) data into vector tiles using **Tilemaker** and the **Shortbread schema**.
- **[VersaTiles tools](https://github.com/versatiles-org/versatiles-rs)**: A toolbox for converting, checking and serving map tiles in various formats.

### Tile Storage & Distribution

- **[Tilesets](basics/tilesets.md)**: Ready-to-use vector tilesets available for download.
- **[Container Format](compendium/specification_container.md)**: A highly efficient and web-accessible format for storing map tiles, offering great performance and flexibility.
- **[VersaTiles Node](https://github.com/versatiles-org/node-versatiles-container)**: An npm package for integrating VersaTiles into JavaScript applications.

### Tile Serving

- **[VersaTiles Server](basics/versatiles_server.md)** A high-performance, Rust-based server that efficiently serves tiles over HTTP.
- **[VersaTiles Server Node](https://github.com/versatiles-org/node-versatiles-server)** Node.js implementation of a VersaTiles server
- **[VersaTiles Frontend](basics/frontend.md)** Pre-packaged assets for VersaTiles Server
<!-- - **VersaTiles Caching** (TBD) -->

### Tile Display and Rendering

- **[VersaTiles Style](https://github.com/versatiles-org/versatiles-style)** Generate [map styles](https://maplibre.org/maplibre-style-spec/) and sprites
- **[VersaTiles Fonts](https://github.com/versatiles-org/versatiles-fonts)** Generate font glyphs for map use
- **[VersaTiles Glyphs](https://github.com/versatiles-org/versatiles-glyphs-rs)** Generate signed distance field glyphs for map use
- **[VersaTiles Renderer](https://github.com/versatiles-org/versatiles-renderer)**: Render a map view as image (WIP)

### Integrations

- **[Svelte Components for VersaTiles](https://github.com/versatiles-org/node-versatiles-svelte)**
- **[MapLibre plugin for editing VersaTiles styles](https://github.com/versatiles-org/maplibre-versatiles-styler)**

## Learning Resources

- [Introduction](compendium/introduction.md)
- [The World of Interactive Web Maps](basics/web_maps.md)

## Get started

- [Use our public tileserver](guides/use_tiles_versatiles_org.md)
- [Install VersaTiles](guides/install_versatiles.md)
- [Download Tilesets or regional subsets](guides/download_tiles.md)
- Run a local VersaTiles Server on [Linux](guides/local_server_debian.md), [MacOS](guides/local_server_mac.md) or with [Docker](guides/local_server_docker.md)

## Deploy a public VersaTiles server

- [**Docker with nginx and certbot**](guides/deploy_using_docker.md)
- [**Debian Linux**](guides/deploy_on_debian.md)
- [**Google Cloud**](guides/deploy_in_google_cloud.md)
- [**Uberspace**](guides/deploy_on_uberspace.md)
<!--
- **Digital Ocean**
- **Kubernetes**
- **Raspberry Pi**
- **AWS**
  -->

## Advanced Guides

- [Use VersaTiles in **Android and iOS** apps](guides/what_about_mobile.md)
- [Use VersaTiles in **QGIS**](guides/use_versatiles_in_qgis.md)
<!-- - *How to add maps into your mobile app with maximum privacy, e.g. by including a server into your app?* -->

## Awesome VersaTiles

- **[Showcases](showcases/)**: VersaTiles in use
- **[Ansible Playbook](https://github.com/mother-of-all-self-hosting/mash-playbook/blob/main/docs/services/versatiles.md)** for running VersaTiles.
- **[Tileblaster](https://github.com/yetzt/tileblaster)**: A map tile caching and processing proxy with support for VersaTiles.

## Contributing

We are gratefully welcoming contributions of data, code, artwork, documentation and translations under the licenses or dedications stated.
Take a look at issues tagged [`help wanted`](https://github.com/search?q=org%3Aversatiles-org+label%3A%22help+wanted%22+state%3Aopen&type=issues) or contact us on [matrix](https://matrix.to/#/#versatiles:matrix.org).
