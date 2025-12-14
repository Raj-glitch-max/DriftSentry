# Secrets Management - AWS Secrets Manager

## Overview

All sensitive credentials stored in AWS Secrets Manager. **Never commit secrets to Git!**

## Phase 8E: Secrets Setup

### Step 1: Create Secrets in AWS

```bash
# Database URL
aws secretsmanager create-secret \
  --name driftsentry/prod/database-url \
  --description "PostgreSQL connection string" \
  --secret-string "postgresql://admin:YOUR_PASSWORD@driftsentry-db.xxx.us-east-1.rds.amazonaws.com:5432/driftsentry" \
  --tags Key=Project,Value=DriftSentry Key=Environment,Value=production

# Redis URL (if using ElastiCache)
aws secretsmanager create-secret \
  --name driftsentry/prod/redis-url \
  --description "Redis connection string" \
  --secret-string "redis://driftsentry-redis.xxx.cache.amazonaws.com:6379" \
  --tags Key=Project,Value=DriftSentry

# JWT Secret
aws secretsmanager create-secret \
  --name driftsentry/prod/jwt-secret \
  --description "JWT signing secret" \
  --secret-string "$(openssl rand -base64 64)" \
  --tags Key=Project,Value=DriftSentry

# API Keys (if needed)
aws secretsmanager create-secret \
  --name driftsentry/prod/api-keys \
  --description "Third-party API keys" \
  --secret-string '{"sentry":"xxx","stripe":"xxx"}' \
  --tags Key=Project,Value=DriftSentry
```

### Step 2: IAM Policy for ECS Tasks

Create policy allowing ECS tasks to read secrets:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": [
        "arn:aws:secretsmanager:us-east-1:*:secret:driftsentry/prod/*"
      ]
    }
  ]
}
```

Attach to ECS task role:

```bash
# Create policy
aws iam create-policy \
  --policy-name DriftSentrySecretsReadPolicy \
  --policy-document file://aws/secrets-policy.json

# Attach to task role
aws iam attach-role-policy \
  --role-name driftsentry-ecs-task-role \
  --policy-arn arn:aws:iam::<ACCOUNT_ID>:policy/DriftSentrySecretsReadPolicy
```

### Step 3: Reference Secrets in Task Definitions

Task definitions already configured to use secrets:

```json
"secrets": [
  {
    "name": "DATABASE_URL",
    "valueFrom": "arn:aws:secretsmanager:us-east-1:<ACCOUNT_ID>:secret:driftsentry/prod/database-url"
  }
]
```

### Step 4: Rotate Secrets (Best Practice)

```bash
# Rotate database password
aws secretsmanager rotate-secret \
  --secret-id driftsentry/prod/database-url \
  --rotation-lambda-arn arn:aws:lambda:us-east-1:<ACCOUNT_ID>:function:SecretsManagerRotation

# Rotate JWT secret (requires app restart)
NEW_SECRET=$(openssl rand -base64 64)
aws secretsmanager update-secret \
  --secret-id driftsentry/prod/jwt-secret \
  --secret-string "$NEW_SECRET"

# Force ECS service restart to pick up new secret
aws ecs update-service \
  --cluster driftsentry-cluster \
  --service driftsentry-backend \
  --force-new-deployment
```

## Local Development Secrets

**Never use production secrets locally!**

Use `.env.local` (gitignored):

```bash
# backend/.env.local
DATABASE_URL=postgresql://admin:admin123@localhost:5432/driftsentry
REDIS_URL=redis://localhost:6379
JWT_SECRET=local-dev-secret-not-for-production
```

## Staging Secrets

Create separate secrets for staging:

```bash
aws secretsmanager create-secret \
  --name driftsentry/stage/database-url \
  --secret-string "postgresql://..." \
  --tags Key=Environment,Value=staging
```

## Security Best Practices

✅ **DO:**
- Use AWS Secrets Manager for production
- Rotate secrets every 90 days
- Use different secrets for dev/stage/prod
- Audit secret access with CloudTrail
- Delete secrets for destroyed environments

❌ **DON'T:**
- Commit secrets to Git
- Share production secrets via Slack/email
- Use same secrets across environments
- Log secret values
- Store secrets in environment variables (use Secrets Manager)

## Cost

**Secrets Manager pricing:**
- $0.40 per secret per month
- $0.05 per 10,000 API calls

**Estimated cost:**
- 4 secrets × $0.40 = $1.60/month
- 1,000 API calls × $0.05/10,000 = $0.01/month
- **Total: ~$1.61/month**

**Alternative (free but less secure):**
- Use environment variables in task definition
- **Cost: $0.00** but secrets visible in console

For MVP, you can start with env vars and migrate to Secrets Manager later.

## Verification

```bash
# Test secret retrieval
aws secretsmanager get-secret-value \
  --secret-id driftsentry/prod/database-url \
  --query SecretString \
  --output text
```

## Phase 8E Complete ✅

Secrets configured and ready for production deployment!
