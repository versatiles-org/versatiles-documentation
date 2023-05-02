```bash
# install dependencies
sudo update
sudo apt-get -q install -y build-essential git wget unzip tmux htop aria2 sysstat brotli cmake ifstat libsqlite3-dev openssl libssl-dev pkg-config curl gnupg2 ca-certificates lsb-release nginx

# install rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"

# install versatiles
cargo install versatiles

# download planet
aria2c "magnet:?xt=urn:btih:0aa672cb0c43012c1adff594f0acbd5d36d6a2f5&dn=2023-01-planet.versatiles&tr=http%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=udp%3A%2F%2Ftracker.openbittorrent.com%3A6969&tr=udp%3A%2F%2Fwww.torrent.eu.org%3A451%2Fannounce"

# download frontend
curl "https://github.com/versatiles-org/versatiles-frontend/releases/download/v0.0.3/frontend.br.tar.gz" | gzip -d > frontend.br.tar

# config nginx
sudo nano /etc/nginx/sites-available/default
# add:
# location / {
#   proxy_pass http://localhost:8080/;
# }
sudo systemctl restart nginx

# run server
versatiles serve "2023-01-planet.versatiles#osm" --static-tar frontend.br.tar -p 8080
```