# ICP (Ideal Customer Profile) - DriftSentry

**Last Updated:** December 15, 2025  
**Status:** Draft - needs validation with real customers

---

## Who is our ideal customer?

### Company Profile

**Size:** 50-500 employees  
**Industry:** SaaS, FinTech, HealthTech, E-commerce  
**Stage:** Series A-C startups, growth-stage companies  
**Geography:** United States + Europe (English-speaking)  
**Tech Maturity:** Cloud-native, DevOps-forward

### Pain Points

**Primary Pain:**
- Losing $5-20K/month on forgotten AWS resources
- Manual infrastructure changes creating drift
- No visibility into who changed what, when
- Compliance and audit challenges

**Secondary Pain:**
- Team coordination issues (who made that change?)
- Security concerns (rogue permission changes)
- Cost optimization blindspots
- Manual tracking is time-consuming

### Technology Stack

**Must Have:**
- AWS (primary cloud provider)
- Terraform or CloudFormation (IaC)
- $20K+ monthly AWS spend

**Nice to Have:**
- Multi-cloud (AWS + GCP/Azure)
- Kubernetes
- Microservices architecture
- DevOps tooling (Jenkins, GitHub Actions, etc.)

---

## Decision Maker

### Primary Buyer

**Title:** VP Engineering, CTO, Head of DevOps/Infrastructure  
**Age:** 30-45  
**Experience:** 8-15 years in tech  
**Priorities:** Cost control, security, team efficiency

### Influencers

- DevOps/Platform engineers (day-to-day users)
- Security/Compliance team (care about audit trail)
- CFO (cares about cost savings)

### Blockers

- Security team (if they don't trust AWS integration)
- CFO (if budget is tight)
- Engineering team (if they're resistant to new tools)

---

## Buying Behavior

### Budget

**What they can spend:** $500-5000/month on infrastructure tools  
**Current tools:** Datadog, PagerDuty, Terraform Cloud, etc.  
**Decision timeline:** 2-4 weeks (startup speed)

### Buying Process

1. Engineer discovers problem (drift happens)
2. Engineer googles "AWS drift detection"
3. Engineer tries free trial
4. Engineer shows value to manager
5. Manager approves budget
6. Purchase happens

**Key:** Bottom-up adoption (engineer-led), not top-down

---

## Where to Find Them

### Online Communities

- **Reddit:** r/devops, r/aws, r/terraform
- **Slack:** DevOps communities, AWS user groups
- **Twitter/X:** Follow #DevOps, #AWS, #CloudArchitecture
- **LinkedIn:** Search by title (VP Eng, CTO, DevOps Lead)

### Events

- AWS re:Invent
- DevOps Enterprise Summit
- Local AWS meetups
- Infrastructure/SRE conferences

### Content

- Dev.to (technical articles)
- Hacker News (Show HN posts)
- Medium (DevOps topics)
- YouTube (AWS tutorials)

---

## ICP Validation Questions

Ask every customer:

1. **Firmographic:** "What's your company size and industry?"
2. **Pain:** "What's your biggest infrastructure challenge?"
3. **Budget:** "What do you spend on DevOps tools today?"
4. **Decision:** "Who else needs to approve this purchase?"
5. **Timeline:** "When do you need this solved?"

---

## Anti-ICP (Who NOT to Target)

❌ Small startups (<10 people) - too small, can't pay
❌ Enterprises (>2000 people) - too slow, need custom everything
❌ Non-cloud companies - not our problem to solve
❌ Cost-sensitive teams - won't pay $500/month

---

## ICP Prioritization

### Tier 1 (Best Fit - Target First)

- 100-300 person SaaS company
- AWS spend: $50K+/month
- Using Terraform
- Had a recent incident due to drift
- VP Eng or CTO can approve purchases

### Tier 2 (Good Fit - Target Second)

- 50-100 person startup
- AWS spend: $20-50K/month
- Using any IaC tool
- DevOps team of 3+

### Tier 3 (Maybe - Only if inbound)

- <50 people
- <$20K AWS spend
- No IaC
- Solo DevOps engineer

---

## Sample ICP Personas

### Persona 1: "Sarah, VP Engineering"

- **Company:** 200-person Series B SaaS
- **Challenge:** Recent security incident from drift
- **Quote:** "We had a security group opened manually during an incident. Nobody closed it. Got flagged in audit. I need to prevent this."
- **Budget:** Can approve $5K/month tools
- **How to reach:** LinkedIn, DevOps Slack communities

### Persona 2: "Mike, DevOps Lead"

- **Company:** 80-person Series A FinTech
- **Challenge:** CFO asking where AWS costs are going
- **Quote:** "We're spending $30K/month on AWS but nobody knows what's actually running. I need visibility."
- **Budget:** Must pitch to CTO for approval
- **How to reach:** r/devops, AWS meetups

### Persona 3: "Lisa, Platform Engineer"

- **Company:** 150-person E-commerce
- **Challenge:** Manual tracking is killing her time
- **Quote:** "I spend 5 hours/week tracking infrastructure changes manually. I just want it automated."
- **Budget:** $500-1000/month self-approved
- **How to reach:** Twitter, Dev.to

---

## Next Steps

1. **Validate with 5 customers** - Are these assumptions correct?
2. **Refine based on data** - Who actually buys? Who churns?
3. **Update monthly** - IC P evolves as you learn

---

**Remember:** Specific beats generic. The tighter the ICP, the higher the conversion rate.
