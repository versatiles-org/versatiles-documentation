# How to run a VersaTiles server on Uberspace

In this guide, we will explain how to set up and run a VersaTiles server on [↗ Uberspace](https://uberspace.de/).

## Install Versatiles

Uberspace comes with rust already in place. You can simply install the `versatiles` crate:

```sh
cargo install versatiles
```

[↗ Relevant Uberspace Manual](https://manual.uberspace.de/lang-rust/)

## Download tiles

### Download the full planet

::: warning
Uberspace has a [↗ user quota of 10GB by default](https://manual.uberspace.de/basics-resources/#storage). You have to [↗ upgrade your storage](https://manual.uberspace.de/billing-general/#storage) if you want to serve the full planet.
:::

```sh
wget -c https://download.versatiles.org/osm.versatiles
```

### Alternative: Download a regional subset

You can quite easily download only a certain area, using the `versatiles` tool with the `--bbox` option.
You can use this [↗ BoundingBox tool](https://boundingbox.klokantech.com/) with the `CSV` option to easily create a bounding box for your desired area.

For example:

```sh
versatiles convert --bbox-border 3 --bbox "5.988,47.302,15.017,54.983" https://download.versatiles.org/osm.versatiles osm.versatiles
```

[Learn more about downloading tiles](./download_tiles.md#partial-download)

## Download Frontend

The frontend contains static files such as libraries, map styles, and fonts.

```sh
wget https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar.gz
```

::: info
There is no need to extract this file.
:::

## Run Server

Use your favourite editor to create `~/etc/services.d/versatiles.ini`.
Use any port between `1024` and `65535` you like. This example uses `41241`.

::: warning
Make sure to replace `<username>` with your actual username and check if the paths correspond to the files you downloaded
:::

```ini
[program:versatiles]
command=/home/<username>/.cargo/bin/versatiles serve -i 0.0.0.0 -p 41241 -s /home/<username>/frontend.br.tar.gz "[osm]/home/<username>/osm.versatiles"
startsecs=60
```

Now you can use `supervisorctl` to start the versatiles server as a daemon:

```sh
supervisorctl reread
supervisorctl update
```

[↗ Relevant Uberspace Manual](https://manual.uberspace.de/daemons-supervisord/)

## Expose Server as Web Backend

```sh
uberspace web backend set / --http --port 41241
```

[↗ Relevant Uberspace Manual](https://manual.uberspace.de/web-backends/)

The VersaTiles server will now be running locally on your Uberspace host. To test it open `http://<username>.uber.space/` in your browser.

Refer to the [↗ Uberspace manual](https://manual.uberspace.de/) for further questions regarding Uberspace.

For more information, see the documentation on [using the VersaTiles server](../basics/versatiles_server.md#usage).
