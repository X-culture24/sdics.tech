# Fix GitHub Push and Configure Secrets

## Step 1: Remove Large Files from Git History

```bash
# Reset to before the failed push
git reset --soft HEAD~1

# Remove node_modules from cache
rm -rf frontend/node_modules/.cache
rm -rf frontend-mobile/node_modules/.cache
rm -rf frontend/dist
rm -rf frontend-mobile/dist

# Update .gitignore to prevent re-adding these
cat >> .gitignore << 'EOF'

# Build and cache
dist/
.cache/
node_modules/.cache/
EOF

# Re-add files without node_modules
git add .
git commit -m "Initial commit with all files - removed large cache files"

# Force push (since history changed)
git push -u origin main --force
```

## Step 2: Configure GitHub Secrets

Once push succeeds, configure these secrets in GitHub:

### Go to: https://github.com/X-culture24/sdics.tech/settings/secrets/actions

### Add these secrets:

#### 1. SERVER_SSH_KEY
- Name: `SERVER_SSH_KEY`
- Value: Your private SSH key content

To generate:
```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/sdics_deploy -N ""
cat ~/.ssh/sdics_deploy
# Copy the entire output (including -----BEGIN and -----END)
```

#### 2. SERVER_SSH_KNOWN_HOSTS (Optional but recommended)
```bash
ssh-keyscan 206.81.28.246
# Copy the output
```

## Step 3: Add Deploy Key to GitHub

### Go to: https://github.com/X-culture24/sdics.tech/settings/keys

Click "Add deploy key":
- Title: `Server Deploy Key`
- Key: Contents of `~/.ssh/sdics_deploy.pub`
- Allow write access: ✓ Check this

```bash
cat ~/.ssh/sdics_deploy.pub
# Copy the entire output
```

## Step 4: Verify Secrets are Set

```bash
# After adding secrets, push a test commit
git add .
git commit -m "Test GitHub Actions workflow"
git push

# Then go to: https://github.com/X-culture24/sdics.tech/actions
# Click the latest workflow and watch the logs
```

## Complete Secrets Configuration

Your `.github/workflows/deploy.yml` needs these secrets:

| Secret Name | Description | Where to Get |
|------------|-------------|--------------|
| `SERVER_SSH_KEY` | Private SSH key for root@206.81.28.246 | `ssh-keygen` output |

### Generate SSH Key (if you haven't already):

```bash
# Generate key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/sdics_deploy -N ""

# View private key
cat ~/.ssh/sdics_deploy

# View public key
cat ~/.ssh/sdics_deploy.pub

# Test SSH connection
ssh -i ~/.ssh/sdics_deploy root@206.81.28.246 "whoami"
```

### Add Private Key to GitHub Secrets:

1. Open GitHub Repository Settings
2. Go to Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `SERVER_SSH_KEY`
5. Value: (paste entire contents of `~/.ssh/sdics_deploy`)
6. Click "Add secret"

## Environment File on Server

After GitHub Actions deploys, SSH to server and configure:

```bash
ssh root@206.81.28.246

# Edit the .env file with your actual secrets
nano /var/www/sdics.tech/.env

# Change these values:
DJANGO_SECRET_KEY=your-actual-secret-key
DB_PASSWORD=your-actual-db-password
JWT_SECRET_KEY=your-actual-jwt-secret
JWT_REFRESH_SECRET_KEY=your-actual-refresh-secret
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

## Test Deployment

After everything is configured:

```bash
# Make a test commit
touch test.txt
git add test.txt
git commit -m "Trigger deployment"
git push

# Watch deployment at:
# https://github.com/X-culture24/sdics.tech/actions

# Once deployed, verify:
curl https://sdics.tech/
```

## Troubleshooting

### SSH Connection Fails
```bash
# Test SSH manually
ssh -i ~/.ssh/sdics_deploy root@206.81.28.246 "ls -la /var/www"

# Check permissions
chmod 600 ~/.ssh/sdics_deploy
chmod 644 ~/.ssh/sdics_deploy.pub
```

### Workflow Still Fails
1. Check GitHub Actions logs: https://github.com/X-culture24/sdics.tech/actions
2. Look for error messages in workflow run
3. Common issues:
   - SSH key not added to secrets correctly
   - Server IP unreachable
   - Permission denied (wrong key permissions)
   - Port 22 blocked by firewall

### View Deployment Logs on Server
```bash
ssh root@206.81.28.246
tail -f /var/www/logs/backend-error.log
journalctl -u sdics-backend -f
```

## Next Steps

1. ✅ Fix GitHub push (remove large files)
2. ✅ Generate SSH key
3. ✅ Add SSH private key to GitHub Secrets
4. ✅ Add SSH public key as Deploy Key
5. ✅ Push test commit
6. ✅ Monitor GitHub Actions workflow
7. ✅ SSH to server and update .env
8. ✅ Restart backend service
9. ✅ Access https://sdics.tech

