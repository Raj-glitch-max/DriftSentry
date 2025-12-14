# Branch Strategy - Enterprise Level

## 🌳 Branch Structure

### 1. **dev** (Development)
- **Purpose**: Active development work
- **Deploy to**: Local/Development environment
- **Protection**: None (free commits)
- **Merge from**: Direct commits
- **Merge to**: stage (when feature complete)

### 2. **stage** (Staging/UAT)
- **Purpose**: Pre-production testing
- **Deploy to**: AWS Staging environment
- **Protection**: Require PR from dev
- **Testing**: Full integration tests, UAT
- **Merge to**: prod (after approval)

### 3. **prod** (Production)
- **Purpose**: Live production code
- **Deploy to**: AWS Production (Fargate)
- **Protection**: Require PR from stage + approval
- **Testing**: All tests must pass
- **Rollback**: Tag each deployment

### 4. **dev-devops** (Your Private Branch)
- **Purpose**: Your personal DevOps experiments
- **Status**: Never touched by me
- **Owner**: You only

## 🔄 Workflow

```
dev (development)
  ↓ PR + merge
stage (pre-production testing)
  ↓ PR + approval
prod (production release)
```

## 📝 Commit Strategy

**dev branch:**
- Direct commits allowed
- Feature work, bug fixes
- Frequent small commits

**stage branch:**
- Only PR merges from dev
- Release candidates
- Version tags (v1.0.0-rc1)

**prod branch:**
- Only PR merges from stage
- Stable releases
- Version tags (v1.0.0)

## 🚀 Deployment Pipeline

**dev → AWS Dev environment (optional)**
- Auto-deploy on push
- Latest unstable code

**stage → AWS Staging**
- Auto-deploy on merge to stage
- UAT environment
- Near-production config

**prod → AWS Production**
- Manual approval required
- Zero-downtime deployment
- Automatic rollback on failure

## 🏷️ Tagging Convention

- **dev**: No tags
- **stage**: `v1.2.3-rc1`, `v1.2.3-rc2`
- **prod**: `v1.2.3`, `v1.2.4`

## 🔐 Branch Protection Rules

**stage:**
- Require PR from dev
- Require 1 approval
- Require CI/CD to pass

**prod:**
- Require PR from stage
- Require 1 approval
- Require CI/CD to pass
- Require status checks

## 📊 Current Status

- ✅ **dev** - Created, tracking origin
- ✅ **stage** - Created, tracking origin
- ✅ **prod** - Created, tracking origin
- ✅ **dev-devops** - Exists, untouched

**Active branch:** dev (where I work)

## 🎯 My Workflow

1. Work on **dev** branch
2. Commit frequently
3. When ready for testing → PR to **stage**
4. After UAT passes → PR to **prod**
5. **NEVER touch dev-devops** ✅
