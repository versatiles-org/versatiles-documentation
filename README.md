**VersaTiles** is an open-source ecosystem for generating, processing, storing, serving and rendering [map tiles](basics/web_maps.md) — a self-hosted alternative to commercial providers, with full control over the pipeline.
[Learn more](basics/versatiles.md)

Try the live demo at **[tiles.versatiles.org](https://tiles.versatiles.org)**.

## Showcases

[51+ projects](showcases) use VersaTiles in production, from journalism and transit trackers to commercial platforms and research tools.

## VersaTiles components

The VersaTiles ecosystem consists of several components, each playing a role in the **end-to-end map tile workflow**:

### Tile generation and processing

- **[Generate Tiles](https://docs.versatiles.org/guides/generate_tiles_from_osm)**: Converts [OpenStreetMap](https://www.openstreetmap.org/) data into vector tiles using **Planetiler** and the **Shortbread schema**.
- **[VersaTiles CLI](https://github.com/versatiles-org/versatiles-rs)**: A toolbox for converting, checking and serving map tiles in various formats.

### Tile storage & distribution

- **[Tilesets](basics/tilesets.md)**: Ready-to-use vector tilesets available for download.
- **[Container Format](compendium/specification_container.md)**: A highly efficient and web-accessible format for storing map tiles, offering great performance and flexibility.
- **[VersaTiles Node](https://github.com/versatiles-org/node-versatiles-container)**: An npm package for integrating VersaTiles into JavaScript applications.

### Tile serving

- **[VersaTiles Server](basics/versatiles_server.md)**: A high-performance, Rust-based server that efficiently serves tiles over HTTP.
- **[VersaTiles Server Node](https://github.com/versatiles-org/node-versatiles-server)**: Node.js implementation of a VersaTiles server.
- **[VersaTiles Frontend](basics/frontend.md)**: Pre-packaged assets for VersaTiles Server.

<!-- - **VersaTiles Caching** (TBD) -->

### Tile display and rendering

- **[VersaTiles Style](https://github.com/versatiles-org/versatiles-style)**: Generate [map styles](https://maplibre.org/maplibre-style-spec/) and sprites.
- **[VersaTiles Fonts](https://github.com/versatiles-org/versatiles-fonts)**: Generate font glyphs for map use.
- **[VersaTiles Glyphs](https://github.com/versatiles-org/versatiles-glyphs-rs)**: Generate signed distance field glyphs for map use.
- **[VersaTiles Renderer](https://github.com/versatiles-org/versatiles-svg-renderer)**: Render a map view as image (WIP).

### Integrations

- **[Svelte Components for VersaTiles](https://github.com/versatiles-org/node-versatiles-svelte)**: Svelte components and bindings for displaying VersaTiles in MapLibre GL JS.
- **[MapLibre Style Editor](https://github.com/versatiles-org/maplibre-versatiles-styler)**: Browser-based plugin for editing VersaTiles map styles in MapLibre GL JS.

## Learning resources

- [Introduction](compendium/introduction.md)
- [The World of Interactive Web Maps](basics/web_maps.md)

## Get started

- [Use our public tileserver](guides/use_tiles_versatiles_org.md)
- [Install VersaTiles](guides/install_versatiles.md)
- [Download Tilesets or regional subsets](guides/download_tiles.md)
- Run a local VersaTiles Server on [Linux](guides/local_server_debian.md), [macOS](guides/local_server_mac.md) or with [Docker](guides/local_server_docker.md)

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

## Advanced guides

- [Use VersaTiles in **Android and iOS** apps](guides/what_about_mobile.md)
- [Use VersaTiles in **QGIS**](guides/use_versatiles_in_qgis.md)

<!-- - *How to add maps into your mobile app with maximum privacy, e.g. by including a server into your app?* -->

## Awesome VersaTiles

- **[Ansible Playbook](https://github.com/mother-of-all-self-hosting/mash-playbook/blob/main/docs/services/versatiles.md)**: Run VersaTiles with Ansible.
- **[Tileblaster](https://github.com/yetzt/tileblaster)**: A map tile caching and processing proxy with support for VersaTiles.

## Contributing

Contributions of data, code, artwork and documentation are warmly welcome. The most useful starting points — adding a showcase, fixing typos, reporting bugs — are described in [CONTRIBUTING.md](CONTRIBUTING.md).
