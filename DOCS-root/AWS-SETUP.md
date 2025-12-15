# AWS Infrastructure Setup - DriftSentry

## Overview

Complete AWS deployment using free tier only. **Cost: $0-$1/month guaranteed.**

## Prerequisites

1. AWS Account (free tier eligible)
2. AWS CLI installed: `aws --version`
3. AWS credentials configured: `aws configure`
4. Docker and Docker Compose installed

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AWS Cloud (us-east-1)                │
│                                                           │
│  ┌──────────────┐         ┌──────────────┐              │
│  │   ECR        │         │  Secrets     │              │
│  │ (Images)     │         │  Manager     │              │
│  └──────────────┘         └──────────────┘              │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │              ECS Fargate Cluster                   │  │
│  │  ┌──────────────┐      ┌──────────────┐           │  │
│  │  │   Backend    │      │   Frontend   │           │  │
│  │  │   (Task)     │      │    (Task)    │           │  │
│  │  └──────────────┘      └──────────────┘           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  ┌──────────────┐         ┌──────────────┐              │
│  │  RDS Postgres│         │    Redis     │              │
│  │ (db.t3.micro)│         │ (local/skip) │              │
│  └──────────────┘         └──────────────┘              │
│                                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │            CloudWatch (Logs + Metrics)             │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Phase 8D: Step-by-Step Setup

### Step 1: Configure AWS CLI

```bash
aws configure
# AWS Access Key ID: <your-key>
# AWS Secret Access Key: <your-secret>
# Default region: us-east-1
# Default output format: json
```

### Step 2: Create Budget Alerts

**CRITICAL: Set cost cap at $1/month**

```bash
# Create budget
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://aws/budget.json \
  --notifications-with-subscribers file://aws/budget-notifications.json
```

**File: `aws/budget.json`**
```json
{
  "BudgetName": "DriftSentry-Monthly-Budget",
  "BudgetLimit": {
    "Amount": "1.0",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST",
  "CostFilters": {
    "TagKeyValue": ["user:Project$DriftSentry"]
  }
}
```

**File: `aws/budget-notifications.json`**
```json
[
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 50,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "your-email@example.com"
      }
    ]
  },
  {
    "Notification": {
      "NotificationType": "ACTUAL",
      "ComparisonOperator": "GREATER_THAN",
      "Threshold": 80,
      "ThresholdType": "PERCENTAGE"
    },
    "Subscribers": [
      {
        "SubscriptionType": "EMAIL",
        "Address": "your-email@example.com"
      }
    ]
  }
]
```

### Step 3: Create ECR Repositories

```bash
# Create backend repository
aws ecr create-repository \
  --repository-name driftsentry-backend \
  --region us-east-1 \
  --tags Key=Project,Value=DriftSentry

# Create frontend repository
aws ecr create-repository \
  --repository-name driftsentry-frontend \
  --region us-east-1 \
  --tags Key=Project,Value=DriftSentry

# Get login credentials
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com
```

### Step 4: Create RDS PostgreSQL (Free Tier)

```bash
# Create database
aws rds create-db-instance \
  --db-instance-identifier driftsentry-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username admin \
  --master-user-password "$(openssl rand -base64 32)" \
  --allocated-storage 20 \
  --storage-type gp3 \
  --no-multi-az \
  --publicly-accessible false \
  --backup-retention-period 7 \
  --enable-cloudwatch-logs-exports '["postgresql"]' \
  --tags Key=Project,Value=DriftSentry
```

**Cost: $0.00** (Free tier: 750 hours/month db.t3.micro)

### Step 5: Create ECS Fargate Cluster

```bash
# Create cluster
aws ecs create-cluster \
  --cluster-name driftsentry-cluster \
  --capacity-providers FARGATE FARGATE_SPOT \
  --tags key=Project,value=DriftSentry
```

### Step 6: Create Task Definitions

**Backend Task Definition:**

```bash
aws ecs register-task-definition --cli-input-json file://aws/backend-task-definition.json
```

See `aws/backend-task-definition.json` for full config.

### Step 7: Create ECS Services

```bash
# Backend service
aws ecs create-service \
  --cluster driftsentry-cluster \
  --service-name driftsentry-backend \
  --task-definition driftsentry-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

**Cost: $0.00** (Free tier: 1M task-seconds/month)

### Step 8: CloudWatch Logs

```bash
# Create log groups
aws logs create-log-group --log-group-name /ecs/driftsentry-backend
aws logs create-log-group --log-group-name /ecs/driftsentry-frontend

# Set retention (7 days free)
aws logs put-retention-policy \
  --log-group-name /ecs/driftsentry-backend \
  --retention-in-days 7
```

## Cost Breakdown (Monthly)

| Service | Instance | Free Tier | Cost |
|---------|----------|-----------|------|
| **RDS PostgreSQL** | db.t3.micro | 750 hrs/mo | $0.00 |
| **Fargate** | 0.25 vCPU, 0.5GB | 1M task-sec | $0.00 |
| **ECR** | Storage | 500MB | $0.00 |
| **CloudWatch** | Logs | 5GB | $0.00 |
| **Data Transfer** | Outbound | 15GB | $0.00 |
| **TOTAL** | | | **$0.00** ✅ |

## Security Configuration

### IAM Roles

**ECS Task Execution Role:** Allows ECS to pull images from ECR
**ECS Task Role:** Allows containers to access AWS services

```bash
# Create execution role
aws iam create-role \
  --role-name driftsentry-ecs-execution-role \
  --assume-role-policy-document file://aws/ecs-trust-policy.json

# Attach policies
aws iam attach-role-policy \
  --role-name driftsentry-ecs-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
```

### Security Groups

```bash
# Create security group for backend
aws ec2 create-security-group \
  --group-name driftsentry-backend-sg \
  --description "DriftSentry Backend Security Group" \
  --vpc-id vpc-xxx

# Allow port 3001 from anywhere (for testing - restrict in production)
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxx \
  --protocol tcp \
  --port 3001 \
  --cidr 0.0.0.0/0
```

## Deployment Commands

### Push Images to ECR

```bash
# Build and push backend
cd backend
docker build -t driftsentry-backend .
docker tag driftsentry-backend:latest \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/driftsentry-backend:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/driftsentry-backend:latest

# Build and push frontend
cd ../frontend
docker build -t driftsentry-frontend .
docker tag driftsentry-frontend:latest \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/driftsentry-frontend:latest
docker push $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com/driftsentry-frontend:latest
```

### Update Service

```bash
# Force new deployment
aws ecs update-service \
  --cluster driftsentry-cluster \
  --service driftsentry-backend \
  --force-new-deployment
```

## Monitoring

### View Logs

```bash
# Backend logs
aws logs tail /ecs/driftsentry-backend --follow

# Frontend logs
aws logs tail /ecs/driftsentry-frontend --follow
```

### Check Service Status

```bash
aws ecs describe-services \
  --cluster driftsentry-cluster \
  --services driftsentry-backend
```

## Cleanup (Destroy Everything)

```bash
# Delete services
aws ecs delete-service --cluster driftsentry-cluster --service driftsentry-backend --force
aws ecs delete-service --cluster driftsentry-cluster --service driftsentry-frontend --force

# Delete cluster
aws ecs delete-cluster --cluster driftsentry-cluster

# Delete RDS
aws rds delete-db-instance --db-instance-identifier driftsentry-db --skip-final-snapshot

# Delete ECR repos
aws ecr delete-repository --repository-name driftsentry-backend --force
aws ecr delete-repository --repository-name driftsentry-frontend --force
```

## Next Steps

1. ✅ Create AWS account
2. ✅ Configure AWS CLI
3. ✅ Set budget alerts
4. ✅ Create ECR repositories
5. ✅ Create RDS database
6. ✅ Create ECS cluster
7. ⬜ Store secrets in Secrets Manager (Phase 8E)
8. ⬜ Deploy to production (Phase 8F)
9. ⬜ Set up monitoring (Phase 8G)
10. ⬜ Load testing (Phase 8H)

## Support

If cost exceeds $1.00, **STOP immediately** and investigate:

```bash
# Check current month cost
aws ce get-cost-and-usage \
  --time-period Start=$(date -u -d "$(date +%Y-%m-01)" +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost
```
