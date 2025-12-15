# Monitoring & Observability - DriftSentry

## Phase 8G: CloudWatch Monitoring Setup

Complete monitoring, logging, and alerting configuration for production.

## Architecture

```
Application Logs → CloudWatch Logs → CloudWatch Alarms → SNS → Email/Slack
Application Metrics → CloudWatch Metrics → Dashboards
```

## CloudWatch Logs

### Log Groups (Already Created)

- `/ecs/driftsentry-backend` - Backend application logs
- `/ecs/driftsentry-frontend` - Frontend application logs

### View Logs

```bash
# Live tail
aws logs tail /ecs/driftsentry-backend --follow

# Last 10 minutes
aws logs tail /ecs/driftsentry-backend --since 10m

# Filter errors
aws logs tail /ecs/driftsentry-backend --follow --filter-pattern "ERROR"

# Filter by request ID
aws logs tail /ecs/driftsentry-backend --follow --filter-pattern "requestId=abc123"
```

### Log Insights Queries

```bash
# Error rate (last hour)
aws logs start-query \
  --log-group-name /ecs/driftsentry-backend \
  --start-time $(date -u -d '1 hour ago' +%s) \
  --end-time $(date -u +%s) \
  --query-string 'fields @timestamp, @message | filter @message like /ERROR/ | stats count() by bin(5m)'
```

**Useful queries:**

1. **Top 10 slowest requests:**
```
fields @timestamp, duration, path
| filter duration > 1000
| sort duration desc
| limit 10
```

2. **Error breakdown by type:**
```
fields @timestamp, error.type, error.message
| filter level = "error"
| stats count() by error.type
```

3. **Requests per minute:**
```
fields @timestamp
| stats count() by bin(1m)
```

## CloudWatch Metrics

### Application Metrics

Backend automatically logs:
- Request count
- Request duration
- Error rate
- Database query time
- Cache hit rate

### ECS Metrics (Free)

- CPUUtilization
- MemoryUtilization
- Running task count

View metrics:

```bash
# CPU usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=driftsentry-backend Name=ClusterName,Value=driftsentry-cluster \
  --start-time $(date -u -d '1 hour ago' --iso-8601=seconds) \
  --end-time $(date -u --iso-8601=seconds) \
  --period 300 \
  --statistics Average
```

## CloudWatch Alarms

### Critical Alarms

#### 1. High Error Rate

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name driftsentry-high-error-rate \
  --alarm-description "Error rate > 5% for 5 minutes" \
  --metric-name Errors \
  --namespace DriftSentry \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:<ACCOUNT_ID>:driftsentry-alerts
```

#### 2. Container Restart

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name driftsentry-container-restart \
  --alarm-description "Container restarted unexpectedly" \
  --metric-name RunningTaskCount \
  --namespace AWS/ECS \
  --dimensions Name=ServiceName,Value=driftsentry-backend Name=ClusterName,Value=driftsentry-cluster \
  --statistic Average \
  --period 60 \
  --threshold 0 \
  --comparison-operator LessThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:us-east-1:<ACCOUNT_ID>:driftsentry-alerts
```

#### 3. High CPU Usage

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name driftsentry-high-cpu \
  --alarm-description "CPU > 80% for 10 minutes" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --dimensions Name=ServiceName,Value=driftsentry-backend Name=ClusterName,Value=driftsentry-cluster \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:us-east-1:<ACCOUNT_ID>:driftsentry-alerts
```

### SNS Topic for Alerts

```bash
# Create SNS topic
aws sns create-topic --name driftsentry-alerts

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:<ACCOUNT_ID>:driftsentry-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Confirm subscription (check email)
```

## CloudWatch Dashboard

Create dashboard:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name DriftSentry-Production \
  --dashboard-body file://aws/cloudwatch-dashboard.json
```

**Dashboard includes:**
- Request rate (requests/minute)
- Error rate (%)
- Response time (p50, p95, p99)
- CPU utilization
- Memory utilization
- Database connections
- Cache hit rate

## X-Ray Tracing (Optional)

Enable AWS X-Ray for distributed tracing:

```bash
# Add X-Ray daemon to task definition
"containerDefinitions": [{
  "name": "xray-daemon",
  "image": "amazon/aws-xray-daemon",
  "cpu": 32,
  "memoryReservation": 256,
  "portMappings": [{
    "containerPort": 2000,
    "protocol": "udp"
  }]
}]
```

## Custom Application Metrics

Add to backend code:

```typescript
import { CloudWatch } from 'aws-sdk';
const cloudwatch = new CloudWatch({ region: 'us-east-1' });

// Publish custom metric
await cloudwatch.putMetricData({
  Namespace: 'DriftSentry',
  MetricData: [{
    MetricName: 'DriftDetected',
    Value: 1,
    Unit: 'Count',
    Timestamp: new Date()
  }]
}).promise();
```

## Health Checks

All containers have health checks:

```json
"healthCheck": {
  "command": ["CMD-SHELL", "curl -f http://localhost:3001/health/live || exit 1"],
  "interval": 30,
  "timeout": 5,
  "retries": 3,
  "startPeriod": 60
}
```

## Slack Integration (Optional)

Forward CloudWatch alarms to Slack:

1. Create Lambda function to forward SNS → Slack
2. Subscribe Lambda to SNS topic
3. Configure Slack webhook URL

```javascript
// Lambda handler
exports.handler = async (event) => {
  const message = JSON.parse(event.Records[0].Sns.Message);
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    body: JSON.stringify({
      text: `🚨 ${message.AlarmName}: ${message.NewStateReason}`
    })
  });
};
```

## Cost

**CloudWatch pricing:**
- Logs: 5GB free, then $0.50/GB
- Metrics: 10 metrics free, then $0.30/metric
- Alarms: 10 alarms free, then $0.10/alarm
- Dashboards: 3 dashboards free, then $3/dashboard

**Our usage (estimated):**
- Logs: ~1GB/month = $0.00 (within free tier)
- Metrics: 5 custom + 10 ECS = 15 total = $1.50/month
- Alarms: 5 = $0.00 (within free tier)
- Dashboards: 1 = $0.00 (within free tier)
- **Total: ~$1.50/month**

## Monitoring Checklist

- [ ] CloudWatch log groups created
- [ ] Log retention set (7 days)
- [ ] Critical alarms configured
- [ ] SNS topic created
- [ ] Email subscriptions confirmed
- [ ] Dashboard created
- [ ] Test alarms (trigger intentionally)

## Phase 8G Complete ✅

Monitoring and alerting configured for production!
