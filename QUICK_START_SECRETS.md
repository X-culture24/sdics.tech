# Quick Start - GitHub Secrets Configuration

## TL;DR - Do This Now:

### 1. Generate SSH Key (Run on your machine):
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/sdics_deploy -N ""
```

### 2. Get Private Key (Add to GitHub Secrets):
```bash
cat ~/.ssh/sdics_deploy
```
Copy the entire output (from `-----BEGIN RSA PRIVATE KEY-----` to `-----END RSA PRIVATE KEY-----`)

### 3. Get Public Key (Add to GitHub Deploy Keys):
```bash
cat ~/.ssh/sdics_deploy.pub
```
Copy the entire output

### 4. Add to GitHub - Settings → Secrets and variables → Actions

Click "New repository secret":
- **Name**: `SERVER_SSH_KEY`
- **Value**: (paste private key from step 2)

### 5. Add to GitHub - Settings → Deploy keys

Click "Add deploy key":
- **Title**: `Server Deploy Key`
- **Key**: (paste public key from step 3)
- **Allow write access**: ✓ Check

### 6. Fix and Push:
```bash
# Remove cache from git
rm -rf frontend/node_modules/.cache frontend-mobile/node_modules/.cache
git add .
git commit -m "Remove cache files"
git push -f origin main
```

### 7. Watch Deployment:
Go to: https://github.com/X-culture24/sdics.tech/actions

## What Each Secret Does:

- **SERVER_SSH_KEY**: Allows GitHub Actions to SSH to root@206.81.28.246 and deploy code

## After Deployment:

```bash
# SSH to server
ssh root@206.81.28.246

# Edit .env with your actual secrets
nano /var/www/sdics.tech/.env

# Update these:
DJANGO_SECRET_KEY=generate-strong-random-key
DB_PASSWORD=your-postgres-password
JWT_SECRET_KEY=your-jwt-secret
JWT_REFRESH_SECRET_KEY=your-refresh-secret
EMAIL_HOST_USER=your@email.com
EMAIL_HOST_PASSWORD=your-app-password

# Restart backend
systemctl restart sdics-backend
```

## Test It Works:

```bash
# After everything is configured
curl https://sdics.tech/

# Should return the frontend HTML or redirect to login
```

## Files to Ignore:

Add to `.gitignore` (already done):
```
dist/
.cache/
node_modules/.cache/
```

## Need Help?

1. **SSH key problems**: Run `ssh -i ~/.ssh/sdics_deploy root@206.81.28.246 "whoami"`
2. **GitHub Actions failing**: Check https://github.com/X-culture24/sdics.tech/actions logs
3. **Deployment stuck**: SSH to server and check logs: `journalctl -u sdics-backend -f`

## Checklist:

- [ ] Generated SSH key pair
- [ ] Added SERVER_SSH_KEY to GitHub Secrets
- [ ] Added public key to GitHub Deploy Keys  
- [ ] Removed cache files from git
- [ ] Successfully pushed to main branch
- [ ] GitHub Actions workflow completed successfully
- [ ] Website accessible at https://sdics.tech
- [ ] Updated .env file on server
- [ ] Backend service restarted

Done! Your SDICS dashboard is live at https://sdics.tech 🚀

