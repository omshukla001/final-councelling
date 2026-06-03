# Councler — Production Deploy on AWS EC2

End-to-end guide for running Councler on a single EC2 instance with:

- **EC2** (Ubuntu 22.04 LTS) — hosts the app
- **MongoDB Atlas** — managed database (already configured via `MONGO_URI`)
- **Nginx** (host) — TLS termination + rate limiting + security headers
- **Docker Compose** — runs the backend + Redis
- **Let's Encrypt / certbot** — free auto-renewing TLS

You don't need a load balancer or RDS for this. It serves real traffic fine up to
a few hundred concurrent users on a `t3.small` and can scale vertically before
you need to think harder.

---

## 0. Prerequisites

- An AWS account + IAM user with EC2 permissions.
- A domain name you control (e.g. via Route 53 / Cloudflare / Namecheap).
- MongoDB Atlas cluster URI ready.
- Firebase service-account JSON downloaded locally.
- Razorpay live keys + a webhook secret.
- Groq + Pinecone API keys.

---

## 1. Launch the EC2 instance

1. **AMI**: Ubuntu Server 22.04 LTS (64-bit x86)
2. **Instance type**: `t3.small` (2 vCPU, 2 GB RAM) — plenty for launch; resize later.
3. **Key pair**: create or reuse one. You'll SSH with `ssh -i your-key.pem ubuntu@<ip>`.
4. **Storage**: 20 GB gp3 is enough (Docker layers + logs).
5. **Security Group** — start with these inbound rules only:
   | Port | Source         | Why                       |
   |-----:|----------------|---------------------------|
   |   22 | your IP / 0.0.0.0/0 (tighten after bootstrap) | SSH |
   |   80 | 0.0.0.0/0      | HTTP (certbot + redirect) |
   |  443 | 0.0.0.0/0      | HTTPS                     |
6. **Elastic IP** — allocate and associate one so the public IP doesn't change on reboot.
7. Point your DNS **A record** (`your-domain.com` and `www.your-domain.com`)
   at the Elastic IP. Wait for propagation (check with `dig your-domain.com`).

---

## 2. Bootstrap the instance

SSH in, then run the bootstrap. It installs Docker, Nginx, certbot, UFW, clones
the repo, and stages all config files.

```bash
ssh -i your-key.pem ubuntu@<elastic-ip>

# From your laptop, push the bootstrap first (or pull from your git repo):
scp -i your-key.pem deploy/ec2-bootstrap.sh ubuntu@<elastic-ip>:~

# On the EC2 box:
DOMAIN=your-domain.com REPO_URL=https://github.com/YOUR_ORG/councler-2-1.0-main.git \
    bash ~/ec2-bootstrap.sh
```

Expected outcome:

- `/srv/councler/` cloned
- Nginx configured (HTTP only — certbot will add TLS in step 4)
- `councler.service` staged but **not yet enabled**
- UFW enabled, ports 22/80/443 open

> After the first run, **log out and back in** so your user picks up the new
> `docker` group membership — otherwise `docker compose` will prompt for sudo.

---

## 3. Upload production secrets

Do **not** commit `.env` to git.

On your laptop, prepare the env file from the template:

```bash
cp .env.production.example .env

# Generate strong secrets
python3 -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(64))"
python3 -c "import secrets; print('OTP_SECRET_SALT=' + secrets.token_urlsafe(32))"

# Base64-encode the Firebase service-account JSON in one line
base64 -w0 counsellor-wala-production-firebase-adminsdk-*.json
# Paste that value into FIREBASE_CREDENTIALS_BASE64= in .env
```

Fill every `REPLACE_*` placeholder. Double-check:

- `DEBUG=false`
- `CORS_ORIGINS` contains only your real domains, no `localhost`
- `RAZORPAY_*` keys start with `rzp_live_`, not `rzp_test_`
- `MONGO_URI` points at your Atlas cluster, not `localhost`

Then ship it up:

```bash
scp -i your-key.pem .env ubuntu@<elastic-ip>:/srv/councler/.env

# On the EC2 box, lock it down:
ssh -i your-key.pem ubuntu@<elastic-ip> 'chmod 600 /srv/councler/.env'
```

---

## 4. Start the stack + get TLS

```bash
# On the EC2 box:
sudo systemctl enable --now councler

# Watch startup (first build takes ~3–5 min)
sudo journalctl -u councler -f
# Or follow the app logs directly:
cd /srv/councler && docker compose -f deploy/docker-compose.prod.yml logs -f backend

# Once backend is healthy, get the TLS cert:
sudo certbot --nginx -d your-domain.com -d www.your-domain.com --redirect --agree-tos -m you@your-domain.com
```

Certbot edits `/etc/nginx/sites-available/councler` in place to add the cert
paths and reloads Nginx. It also installs a systemd timer that renews automatically.

---

## 5. Smoke test

```bash
# Health endpoint (should return {"status":"healthy"})
curl -fsSL https://your-domain.com/health

# Frontend loads
curl -fsSL https://your-domain.com/ | head -20

# API sanity
curl -fsSL "https://your-domain.com/api/v1/recommendation-service/college/list?page_size=1"
```

Also visit the site in an incognito window and:

1. Sign up / log in via Firebase
2. Land on the Colleges page (data loads)
3. Open a college — confirm NIRF box renders (including "Unranked" for GFTIs)
4. Add two colleges to Compare — confirm metrics + section-wise diff render
5. Trigger Razorpay payment flow with a real small amount, then refund it via Razorpay dashboard

---

## 6. Operational runbook

### Deploy a new version

```bash
ssh -i your-key.pem ubuntu@<ip>
cd /srv/councler
git pull origin main                   # or the tagged release you want
sudo systemctl restart councler        # rebuilds + restarts
```

The Dockerfile's layer cache means a no-source-change rebuild takes seconds;
a full rebuild takes ~3 minutes.

### Roll back

```bash
cd /srv/councler
git log --oneline -10                  # find the last good SHA
git checkout <sha>
sudo systemctl restart councler
```

### View logs

```bash
# Backend application
docker compose -f deploy/docker-compose.prod.yml logs --tail=200 -f backend

# Nginx access / error
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log

# systemd / boot-time
sudo journalctl -u councler --since '1 hour ago'
```

### Common checks

```bash
# Container health
docker compose -f deploy/docker-compose.prod.yml ps

# Force a backend restart without rebuilding
docker compose -f deploy/docker-compose.prod.yml restart backend

# Disk / memory pressure
df -h /; free -m; docker system df
```

### Database backups

MongoDB Atlas takes automated snapshots for you — confirm the schedule in the
Atlas UI (Clusters → Backup). Free-tier clusters have only on-demand backups; a
paid tier gives point-in-time recovery. **Test a restore quarterly** — untested
backups aren't backups.

### Rotate secrets

```bash
# On laptop: regenerate
python3 -c "import secrets; print(secrets.token_urlsafe(64))"

# Edit .env on the server (or re-scp a new one)
sudo systemctl restart councler
```

Razorpay / Firebase / Groq / Pinecone are rotated in their respective dashboards,
then the new value goes into `.env` and you restart.

---

## 7. What's deliberately NOT in this setup

- **No Redis persistence off the host.** Redis here is a cache + rate-limit store;
  losing it restarts counters, no real data is lost. Move to ElastiCache only
  when you need high availability.
- **No auto-scaling / ALB.** Single EC2 is fine up to ~300 concurrent users.
  When you outgrow it, the next step is an ALB + ASG with this same Dockerfile.
- **No CloudWatch agent.** Logs are on disk + journald. Add the CloudWatch agent
  when you need off-box log retention or alerts.
- **No Sentry / error tracking.** Recommended for phase 2 — add `sentry-sdk` to
  `requirements.txt` and set `SENTRY_DSN` in `.env`.

---

## 8. Security hardening quick-wins (do these before revenue)

- [ ] Set up MFA on the AWS root account + the IAM user you use for deploys.
- [ ] Tighten SSH: restrict port 22 in the Security Group to your office IP
      range (or put the instance behind AWS Systems Manager Session Manager and
      close port 22 entirely).
- [ ] Enable **GuardDuty** in your AWS region — cheap, catches known-bad IPs.
- [ ] Set billing alerts so you find out about runaway bills same-day.
- [ ] Rotate the initial Firebase admin key if it's ever been on a laptop.
- [ ] Audit Atlas IP allowlist — restrict it to the EC2 Elastic IP only.
- [ ] Add a `SECURITY.md` describing how to report vulnerabilities.
- [ ] Run `docker scout cves councler-backend:prod` monthly and apply base-image
      updates.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `502 Bad Gateway` on every request | Backend container not up | `docker compose ... ps` and `logs backend` |
| `503` on specific endpoints only | Rate limit triggered | Check `/var/log/nginx/error.log`, adjust zones in `nginx.conf` |
| Certbot fails to obtain cert | DNS not pointing at EC2, or port 80 blocked | `dig your-domain.com` + `sudo ufw status` |
| Firebase auth always rejects | `FIREBASE_CREDENTIALS_BASE64` wasn't set / mis-encoded | Re-run `base64 -w0` on the JSON, paste without line breaks |
| Razorpay webhook signature mismatch | Trailing whitespace in `RAZORPAY_WEBHOOK_SECRET` | Re-copy from dashboard, no quotes |
| Mongo connection timeout | Atlas IP allowlist doesn't include EC2 Elastic IP | Add it in Atlas → Network Access |
