# CI/CD Documentation

## GitHub Actions Pipeline

Automated workflow for continuous integration and deployment.

### Triggers

**Push events:**
- `develop` branch
- `main` branch
- `feature/**` branches

**Pull requests:**
- Target: `develop` or `main`

### Jobs

#### 1. Quality Checks
- **Runs on**: Every push and PR
- **Actions**:
  - Backend linting
  - Frontend linting
  - TypeScript checks
  - Frontend build verification

#### 2. Build Docker Images
- **Runs on**: Push to `develop` or `main`
- **Actions**:
  - Build backend Docker image
  - Build frontend Docker image
  - Push to GitHub Container Registry (ghcr.io)
  - Cache layers for faster builds

#### 3. Deploy to Production
- **Runs on**: Push to `main` only
- **Actions**:
  - Deploy notification
  - (Placeholder for AWS ECS deployment)

### Image Tagging Strategy

Images are tagged with:
- Branch name (e.g., `develop`, `main`)
- Git SHA (e.g., `develop-abc1234`)
- `latest` (only for default branch)

### Container Registry

Images pushed to: `ghcr.io/<username>/DriftSentry-backend` and `ghcr.io/<username>/DriftSentry-frontend`

### Secrets Required

**For Docker builds:**
- `GITHUB_TOKEN` (auto-provided)

**For AWS deployment (Phase 8F):**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

## Local Testing

Test CI/CD locally with act:

```bash
# Install act
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run quality checks
act -j quality

# Run full workflow
act push
```

## Workflow Files

- `.github/workflows/ci-cd.yml` - Main CI/CD pipeline

## Phase 8 Status

- [x] **8A**: Docker setup
- [x] **8B**: docker-compose
- [x] **8C**: GitHub Actions CI/CD ✅
- [ ] **8D**: AWS infrastructure
- [ ] **8E**: Secrets management
- [ ] **8F**: Production deployment
- [ ] **8G**: Monitoring
- [ ] **8H**: Load testing
