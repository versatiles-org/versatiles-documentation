# How to run a VersaTiles server with nginx on Debian

> [!TIP]
> For most users, the **[Docker + nginx guide](deploy_using_docker.md)** is simpler and fully tested. Use this guide only if you need a manual, non-Docker setup.

Your server requires as an absolute minimum:

- 2 CPU cores
- 4 GB RAM
- 60 GB free disk space

## 0. Create a user "versatiles"

## 1. Update the server and install dependencies

```bash
sudo apt update
# build-essential, libsqlite3-dev, pkg-config, openssl, libssl-dev are needed
# to compile VersaTiles from source via Cargo (libsqlite3-dev for MBTiles support).
sudo apt -q install -y curl nginx build-essential libsqlite3-dev pkg-config openssl libssl-dev
```

## 2. Install Rust

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
```

## 3. Install VersaTiles

```bash
cargo install versatiles
```

## 4. Download frontend and tiles

```bash
cd ~
mkdir versatiles
cd versatiles
curl -Lo frontend.br.tar.gz "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar.gz"
curl -Lo osm.versatiles "https://download.versatiles.org/osm.versatiles"
```

---

> [!WARNING]
> The following steps (5-7) have not been fully tested. Please verify carefully and report any issues.

## 5. Configure nginx

Write the nginx configuration and reload:

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

## 6. Prepare a VersaTiles service

```bash
sudo cat > /etc/systemd/system/versatiles.service <<EOF
[Unit]
Description=VersaTiles server

[Install]
WantedBy=multi-user.target

[Service]
Type=simple
ExecStart=versatiles serve "[osm]osm.versatiles" -s frontend.br.tar.gz -p 8080
WorkingDirectory=/home/versatiles/versatiles
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=%n
EOF
```

## 7. Start service

```bash
sudo systemctl start versatiles
```
