#!/bin/bash

# DriftSentry AWS Deployment Script
# Phase 8D: Complete infrastructure setup

set -e

echo "🚀 DriftSentry AWS Deployment Starting..."
echo "================================================"

# Configuration
REGION="us-east-1"
PROJECT="DriftSentry"
CLUSTER_NAME="driftsentry-cluster"

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "✅ AWS Account ID: $ACCOUNT_ID"

# Step 1: Create ECR Repositories
echo ""
echo "📦 Step 1: Creating ECR repositories..."
aws ecr create-repository \
  --repository-name driftsentry-backend \
  --region $REGION \
  --tags Key=Project,Value=$PROJECT \
  2>/dev/null || echo "Backend repository already exists"

aws ecr create-repository \
  --repository-name driftsentry-frontend \
  --region $REGION \
  --tags Key=Project,Value=$PROJECT \
  2>/dev/null || echo "Frontend repository already exists"

echo "✅ ECR repositories created"

# Step 2: Login to ECR
echo ""
echo "🔐 Step 2: Logging into ECR..."
aws ecr get-login-password --region $REGION | \
  docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
echo "✅ ECR login successful"

# Step 3: Build and Push Backend
echo ""
echo "🐳 Step 3: Building and pushing backend image..."
cd backend
docker build -t driftsentry-backend .
docker tag driftsentry-backend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/driftsentry-backend:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/driftsentry-backend:latest
cd ..
echo "✅ Backend image pushed"

# Step 4: Build and Push Frontend
echo ""
echo "🐳 Step 4: Building and pushing frontend image..."
cd frontend
docker build -t driftsentry-frontend .
docker tag driftsentry-frontend:latest ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/driftsentry-frontend:latest
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/driftsentry-frontend:latest
cd ..
echo "✅ Frontend image pushed"

# Step 5: Create ECS Cluster
echo ""
echo "🏗️  Step 5: Creating ECS cluster..."
aws ecs create-cluster \
  --cluster-name $CLUSTER_NAME \
  --capacity-providers FARGATE FARGATE_SPOT \
  --tags key=Project,value=$PROJECT \
  2>/dev/null || echo "Cluster already exists"
echo "✅ ECS cluster created"

# Step 6: Create CloudWatch Log Groups
echo ""
echo "📊 Step 6: Creating CloudWatch log groups..."
aws logs create-log-group --log-group-name /ecs/driftsentry-backend 2>/dev/null || echo "Backend log group exists"
aws logs create-log-group --log-group-name /ecs/driftsentry-frontend 2>/dev/null || echo "Frontend log group exists"

aws logs put-retention-policy --log-group-name /ecs/driftsentry-backend --retention-in-days 7
aws logs put-retention-policy --log-group-name /ecs/driftsentry-frontend --retention-in-days 7
echo "✅ CloudWatch log groups configured"

# Step 7: Summary
echo ""
echo "================================================"
echo "🎉 Phase 8D Complete!"
echo ""
echo "Next steps:"
echo "1. Configure secrets in AWS Secrets Manager (Phase 8E)"
echo "2. Update task definitions with your subnet/security group IDs"
echo "3. Create ECS services (Phase 8F)"
echo "4. Set up monitoring (Phase 8G)"
echo ""
echo "Images:"
echo "  Backend:  ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/driftsentry-backend:latest"
echo "  Frontend: ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/driftsentry-frontend:latest"
echo ""
echo "Cluster: $CLUSTER_NAME"
echo "Region: $REGION"
echo "================================================"
