# How to run a VersaTiles server with nginx on Debian

> [!TIP]
> For most users, the **[Docker + nginx guide](deploy_using_docker.md)** is simpler. Use this guide if you need a manual, non-Docker setup.

Your server requires as an absolute minimum:

- 2 CPU cores
- 4 GB RAM
- 80 GB free disk space — `osm.versatiles` alone is ~62 GB and keeps growing. A [regional extract](download_tiles.md#partial-download) needs far less.

## 0. Create a user "versatiles"

The server does not need root privileges, so it gets its own unprivileged account:

```bash
sudo adduser --disabled-password --gecos "" versatiles
```

## 1. Install dependencies

```bash
sudo apt update
sudo apt -q install -y curl nginx
```

## 2. Install VersaTiles

The install script downloads the current release and places the binary in `/usr/local/bin`:

```bash
curl -Ls "https://github.com/versatiles-org/versatiles-rs/releases/latest/download/install-unix.sh" | sudo sh
```

The Linux build is statically linked, so it needs no further packages. See [Installing VersaTiles](install_versatiles.md) for other installation methods.

## 3. Download frontend and tiles

Download both into the `versatiles` user's home directory, so the service can read them. `adduser` creates that home directory with mode `0700`, so run the whole block as the `versatiles` user rather than reaching into it from your own account:

```bash
sudo -u versatiles bash << 'EOF'
mkdir -p ~/versatiles
cd ~/versatiles
curl -Lo frontend.br.tar.gz "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar.gz"
curl -Lo osm.versatiles "https://download.versatiles.org/osm.versatiles"
EOF
```

> [!NOTE]
> The planet download is ~62 GB and will take a while. To resume an interrupted download, add `-C -` to the `curl` command.

## 4. Configure nginx

VersaTiles listens on port 8080 and speaks plain HTTP; nginx faces the public internet:

```bash
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    location / {
        proxy_pass http://localhost:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
sudo nginx -t && sudo systemctl reload nginx
```

> [!TIP]
> This serves plain HTTP only. For HTTPS, run [certbot](https://certbot.eff.org/) against this nginx installation, or use the [Docker + nginx image](deploy_using_docker.md), which handles certificates automatically.

## 5. Create a VersaTiles service

```bash
sudo tee /etc/systemd/system/versatiles.service > /dev/null << 'EOF'
[Unit]
Description=VersaTiles server
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=versatiles
Group=versatiles
WorkingDirectory=/home/versatiles/versatiles
ExecStart=/usr/local/bin/versatiles serve -p 8080 -s frontend.br.tar.gz "[osm]osm.versatiles"
Restart=always
RestartSec=5
SyslogIdentifier=versatiles

[Install]
WantedBy=multi-user.target
EOF
```

`ExecStart` must be an absolute path: systemd only searches `/usr/local/bin`, `/usr/local/sbin`, `/usr/bin` and `/usr/sbin`, and it does not use your shell's `PATH`.

## 6. Start the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now versatiles
sudo systemctl status versatiles
```

`enable --now` starts the service and also brings it up again after a reboot. Logs go to the journal:

```bash
sudo journalctl -u versatiles -f
```

Your map is now available on port 80 of the server.
