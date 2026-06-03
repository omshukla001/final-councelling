#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# One-shot bootstrap for a fresh Ubuntu 22.04 LTS EC2 instance.
# Run ONCE as the default `ubuntu` user (or any sudoer).
#
#   curl -fsSL https://your-repo-host/deploy/ec2-bootstrap.sh | bash
# or
#   scp deploy/ec2-bootstrap.sh ubuntu@<ec2-host>:~ && ssh ubuntu@<ec2-host> 'bash ~/ec2-bootstrap.sh'
#
# After this finishes:
#   1. scp your .env file to /srv/councler/.env
#   2. sudo systemctl enable --now councler
#   3. sudo certbot --nginx -d your-domain.com -d www.your-domain.com
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/YOUR_ORG/councler-2-1.0-main.git}"
APP_DIR="${APP_DIR:-/srv/councler}"
DOMAIN="${DOMAIN:-your-domain.com}"

echo "══════════════════════════════════════════════════════════════════"
echo "  Councler EC2 bootstrap — target dir: $APP_DIR"
echo "══════════════════════════════════════════════════════════════════"

# ── 1. System packages ──────────────────────────────────────────────────────
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg lsb-release ufw nginx git certbot python3-certbot-nginx

# ── 2. Docker + compose v2 (official Docker repo) ───────────────────────────
if ! command -v docker >/dev/null 2>&1; then
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker "$USER"
fi

# ── 3. Firewall — only 22, 80, 443 open ─────────────────────────────────────
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP (for certbot + redirect)'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw --force enable

# ── 4. Clone the repo ───────────────────────────────────────────────────────
if [[ ! -d "$APP_DIR/.git" ]]; then
    sudo mkdir -p "$APP_DIR"
    sudo chown "$USER:$USER" "$APP_DIR"
    git clone "$REPO_URL" "$APP_DIR"
else
    echo "Repo already present — skipping clone."
fi

cd "$APP_DIR"

# ── 5. Nginx config ─────────────────────────────────────────────────────────
sudo mkdir -p /etc/nginx/deploy
sudo cp "$APP_DIR/deploy/nginx.proxy.conf" /etc/nginx/deploy/nginx.proxy.conf

# Drop in the main site config (operator will edit domain names before enabling)
sudo cp "$APP_DIR/deploy/nginx.conf" /etc/nginx/sites-available/councler
sudo sed -i "s/your-domain\.com/$DOMAIN/g" /etc/nginx/sites-available/councler

# Remove the stock default
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/councler /etc/nginx/sites-enabled/councler

sudo nginx -t
sudo systemctl reload nginx

# ── 6. systemd unit ─────────────────────────────────────────────────────────
sudo cp "$APP_DIR/deploy/councler.service" /etc/systemd/system/councler.service
sudo systemctl daemon-reload

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "  Bootstrap complete. Next steps:"
echo ""
echo "  1. Upload your production .env:"
echo "       scp .env ubuntu@<ec2-host>:$APP_DIR/.env"
echo ""
echo "  2. Encode Firebase credentials and add to .env:"
echo "       base64 -w0 your-firebase-key.json >> key.b64"
echo "       # Then set FIREBASE_CREDENTIALS_BASE64=<contents of key.b64>"
echo ""
echo "  3. Log out and back in so your user is in the docker group,"
echo "     then start the stack:"
echo "       sudo systemctl enable --now councler"
echo ""
echo "  4. Get a TLS cert (DNS must point at this instance first):"
echo "       sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "  5. Verify:"
echo "       curl -fsSL https://$DOMAIN/health"
echo "══════════════════════════════════════════════════════════════════"
