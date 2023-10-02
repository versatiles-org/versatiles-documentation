# How to run a VersaTiles server with nginx on Debian

Your server requires as an absolute minimum:
- 2 CPU cores
- 4 GB RAM
- 60 GB free disk space

## 0. Create a user "versatiles"

## 1. Update the server and install dependencies
```bash
sudo apt update
sudo apt -q install -y aria2 curl nginx build-essential libsqlite3-dev pkg-config openssl libssl-dev # git wget unzip tmux htop sysstat brotli cmake ifstat gnupg2 ca-certificates lsb-release
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
curl -Lo frontend.br.tar "https://github.com/versatiles-org/versatiles-frontend/releases/latest/download/frontend.br.tar"
aria2c --seed-time=0 "https://download.versatiles.org/planet-20230227.versatiles.torrent"
```

---

Not tested from here on

## 5. config nginx
```bash
sudo nano /etc/nginx/sites-available/default
# add:
# location / {
#   proxy_pass http://localhost:8080/;
# }
sudo systemctl restart nginx
```

## 6. prepare a VersaTiles service
```bash
sudo cat > /etc/systemd/system/versatiles.service <<EOF
[Unit]
Description=VersaTiles server

[Install]
WantedBy=multi-user.target

[Service]
Type=simple
ExecStart=versatiles serve "2023-01-planet.versatiles#osm" --static-tar frontend.br.tar -p 8080 -i 0.0.0.0
WorkingDirectory=/home/abhi/Dev/echo-server
Restart=always
RestartSec=5
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=%n
EOF
```

## 7. start service
```bash
sudo systemctl start versatiles
```
