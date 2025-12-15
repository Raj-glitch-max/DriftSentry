# Deployment Runbook - DriftSentry

## Production Deployment Guide

Complete step-by-step procedures for deploying DriftSentry to AWS.

## Prerequisites

- [ ] AWS account configured
- [ ] AWS CLI installed and authenticated
- [ ] Docker installed locally
- [ ] Git repository cloned
- [ ] All secrets created in Secrets Manager

## Phase 8F: Production Deployment

### Pre-Deployment Checklist

```bash
# 1. Verify current branch
git branch  # Should be on 'dev', 'stage', or 'prod'

# 2. Run tests locally
cd backend && npm test
cd ../frontend && npm run build

# 3. Test with docker-compose
docker-compose up -d
docker-compose logs -f

# 4. Cleanup
docker-compose down
```

### Deployment Steps

#### Step 1: Build and Push Images

```bash
# Run automated deployment script
chmod +x aws/deploy.sh
./aws/deploy.sh
```

Or manually:

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  $(aws sts get-caller-identity --query Account --output text).dkr.ecr.us-east-1.amazonaws.com

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

#### Step 2: Update Task Definitions

```bash
# Replace <ACCOUNT_ID> in task definitions
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
sed -i "s/<ACCOUNT_ID>/$ACCOUNT_ID/g" aws/backend-task-definition.json
sed -i "s/<ACCOUNT_ID>/$ACCOUNT_ID/g" aws/frontend-task-definition.json

# Register updated task definitions
aws ecs register-task-definition --cli-input-json file://aws/backend-task-definition.json
aws ecs register-task-definition --cli-input-json file://aws/frontend-task-definition.json
```

#### Step 3: Create/Update ECS Services

**First-time deployment:**

```bash
# Get subnet and security group IDs
SUBNET_ID=$(aws ec2 describe-subnets --filters "Name=default-for-az,Values=true" --query "Subnets[0].SubnetId" --output text)
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=default" --query "SecurityGroups[0].GroupId" --output text)

# Create backend service
aws ecs create-service \
  --cluster driftsentry-cluster \
  --service-name driftsentry-backend \
  --task-definition driftsentry-backend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SG_ID],assignPublicIp=ENABLED}"

# Create frontend service
aws ecs create-service \
  --cluster driftsentry-cluster \
  --service-name driftsentry-frontend \
  --task-definition driftsentry-frontend \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SG_ID],assignPublicIp=ENABLED}"
```

**Subsequent deployments (update existing service):**

```bash
# Force new deployment with latest image
aws ecs update-service \
  --cluster driftsentry-cluster \
  --service driftsentry-backend \
  --force-new-deployment

aws ecs update-service \
  --cluster driftsentry-cluster \
  --service driftsentry-frontend \
  --force-new-deployment
```

#### Step 4: Monitor Deployment

```bash
# Watch service status
watch -n 5 'aws ecs describe-services --cluster driftsentry-cluster --services driftsentry-backend --query "services[0].{desired:desiredCount,running:runningCount,status:status}"'

# View logs
aws logs tail /ecs/driftsentry-backend --follow
```

#### Step 5: Get Public IPs

```bash
# Backend IP
aws ecs describe-tasks \
  --cluster driftsentry-cluster \
  --tasks $(aws ecs list-tasks --cluster driftsentry-cluster --service-name driftsentry-backend --query "taskArns[0]" --output text) \
  --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" \
  --output text | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --query "NetworkInterfaces[0].Association.PublicIp" --output text

# Frontend IP
aws ecs describe-tasks \
  --cluster driftsentry-cluster \
  --tasks $(aws ecs list-tasks --cluster driftsentry-cluster --service-name driftsentry-frontend --query "taskArns[0]" --output text) \
  --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" \
  --output text | xargs -I {} aws ec2 describe-network-interfaces --network-interface-ids {} --query "NetworkInterfaces[0].Association.PublicIp" --output text
```

#### Step 6: Verify Deployment

```bash
# Health check
BACKEND_IP=<from above>
curl http://$BACKEND_IP:3001/health/live

# API test
curl http://$BACKEND_IP:3001/api/v1/metrics/summary

# Frontend
FRONTEND_IP=<from above>
curl http://$FRONTEND_IP:3000
```

### Post-Deployment

```bash
# Tag release
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# Document deployment
echo "$(date): Deployed v1.0.0 to production" >> DEPLOYMENT_LOG.md
```

## Rollback Procedure

If deployment fails:

```bash
# 1. Stop current deployment
aws ecs update-service \
  --cluster driftsentry-cluster \
  --service driftsentry-backend \
  --desired-count 0

# 2. List previous task definitions
aws ecs list-task-definitions --family-prefix driftsentry-backend --sort DESC

# 3. Rollback to previous version
aws ecs update-service \
  --cluster driftsentry-cluster \
  --service driftsentry-backend \
  --task-definition driftsentry-backend:PREVIOUS_REVISION \
  --desired-count 1 \
  --force-new-deployment

# 4. Verify rollback
aws logs tail /ecs/driftsentry-backend --follow
```

## Zero-Downtime Deployment Strategy

Update `deploymentConfiguration` for   services:

```bash
aws ecs update-service \
  --cluster driftsentry-cluster \
  --service driftsentry-backend \
  --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"
```

This ensures:
- New tasks start before old tasks stop
- No downtime during deployment
- Automatic rollback if health checks fail

## Troubleshooting

**Service won't start:**
```bash
# Check events
aws ecs describe-services --cluster driftsentry-cluster --services driftsentry-backend --query "services[0].events[0:5]"

# Check task status
aws ecs describe-tasks --cluster driftsentry-cluster --tasks <TASK_ARN>
```

**Application errors:**
```bash
# View logs
aws logs tail /ecs/driftsentry-backend --follow --since 10m

# Check health
curl http://<PUBLIC_IP>:3001/health/live
```

**Database connection issues:**
```bash
# Test RDS connection from task
aws ecs execute-command \
  --cluster driftsentry-cluster \
  --task <TASK_ARN> \
  --container backend \
  --interactive \
  --command "/bin/sh"

# Then inside container:
curl $DATABASE_URL
```

## Monitoring

See `MONITORING.md` for CloudWatch setup and alerts.

## Phase 8F Complete ✅

Production deployment procedures documented and ready!
