# DriftSentry Security Posture - Enterprise Documentation

**Last Updated:** December 15, 2025  
**Version:** 1.0  
**Classification:** Public

---

## Executive Summary

DriftSentry is built with enterprise-grade security from day one. Our infrastructure leverages AWS security best practices, end-to-end encryption, and comprehensive audit logging to protect your infrastructure data.

---

## Data Security

### Encryption

**In Transit:**
- TLS 1.3 for all API communications
- WebSocket connections encrypted (wss://)
- Certificate pinning for mobile apps

**At Rest:**
- AES-256 encryption for all database records
- Encrypted backups (AWS RDS automated backups)
- KMS-managed encryption keys

### Data Residency

- Data stored in your chosen AWS region (US-East-1 default)
- No cross-region data transfer without explicit consent
- Customer choice for data location (US, EU, APAC)

###Data Retention

- Active account data: Retained while subscription active
- Audit logs: 7-year retention (compliance requirement)
- Deleted account data: Hard delete within 30 days
- Backups: 30-day retention, then permanent deletion

---

## Access Control

### Authentication

- JWT-based authentication
- API key authentication (bcrypt hashed, never stored plaintext)
- Session management with automatic expiry
- Rate limiting on all endpoints

### Authorization (RBAC)

- **Admin**: Full access (create, approve, delete)
- **Editor**: Create and edit drifts
- **Viewer**: Read-only access
- Custom roles available (Enterprise tier)

### Multi-Factor Authentication

- TOTP-based MFA (Google Authenticator, Authy)
- SMS-based MFA (optional)
- Recovery codes (10 single-use codes)

### SSO Integration (Enterprise)

- SAML 2.0 support
- OAuth 2.0 integration
- Active Directory Federation Services (ADFS)
- Okta, Azure AD, Google Workspace

---

## Infrastructure Security

### AWS Infrastructure

- VPC network isolation
- Security groups with least-privilege access
- Private subnets for database
- Public subnets for application layer only
- AWS WAF for DDoS protection

### Container Security

- Non-root containers (all services run as user 1001)
- Multi-stage Docker builds (no dev dependencies in production)
- Regular security scans (Trivy, Snyk)
- Automated vulnerability patching

### Secrets Management

- AWS Secrets Manager for production secrets
- No secrets in Git or code
- Automatic secret rotation every 90 days
- Secrets encrypted at rest with KMS

---

## Application Security

### Secure Development

- Security code reviews (all PRs)
- OWASP Top 10 mitigation
- SQL injection prevention (Prisma ORM)
- XSS prevention (Content Security Policy)
- CSRF protection (token-based)

### Dependency Management

- Automated dependency scanning (GitHub Dependabot)
- Weekly security updates
- No dependencies with known critical vulnerabilities
- License compliance checking

### API Security

- Rate limiting (100 requests/min global, 5/min auth)
- Input validation (all endpoints)
- Output encoding (prevent XSS)
- API versioning (/api/v1)

---

## Monitoring & Incident Response

### Security Monitoring

- Real-time threat detection (AWS GuardDuty)
- Intrusion detection (AWS Macie)
- Log aggregation (CloudWatch)
- Security alerts (PagerDuty, Slack)

### Audit Logging

- All actions logged (who, what, when)
- Immutable audit trail
- 7-year retention
- Audit log export (CSV, JSON)

### Incident Response

- 24/7 security monitoring
- < 1 hour response time (critical incidents)
- Incident runbook documented
- Post-mortem published (public incidents)

### Vulnerability Disclosure

- Security email: security@driftsentry.com
- Responsible disclosure policy
- Bug bounty program (planned)

---

## Compliance

### Current Status

**SOC 2 Type II:**
- In progress (expected Q1 2026)
- Audit firm: [TBD]

**ISO 27001:**
- Roadmap (Q2 2026)

**GDPR:**
- Compliant (EU data residency available)
- Data processing agreement available
- Right to deletion honored

**HIPAA:**
- Not currently compliant
- Roadmap for healthcare customers (Q3 2026)

### Compliance Features

- Data processing agreements (DPA)
- Business associate agreements (BAA, healthcare)
- Privacy policy
- Terms of service
- Subprocessor list

---

## Business Continuity

### Uptime SLA

**Standard (Pro Tier):**
- 99.5% uptime
- No SLA credits

**Enterprise Tier:**
- 99.9% uptime SLA
- 10% monthly credit for < 99.9%
- 25% monthly credit for < 99.5%

### Disaster Recovery

**RTO (Recovery Time Objective):** 4 hours  
**RPO (Recovery Point Objective):** 15 minutes

**Backup Strategy:**
- Automated daily backups (RDS)
- Point-in-time recovery (last 30 days)
- Multi-AZ deployment (high availability)
- Tested quarterly

### Failover

- Automatic failover to standby instance
- < 60 second failover time
- Zero data loss on failover

---

## Third-Party Security

### Subprocessors

| Vendor | Purpose | Data Shared | Location |
|--------|---------|-------------|----------|
| AWS | Infrastructure | All application data | US-East-1 |
| GitHub | Code repository | Source code only | US |
| Stripe | Payments | Billing data only | US |

### Vendor Security Reviews

- Annual security reviews
- SOC 2 reports reviewed
- Data processing agreements signed

---

## Customer Data Rights

### Data Access

- Customers can export all their data (JSON, CSV)
- API access to all records
- Real-time dashboard access

### Data Deletion

- Self-service account deletion
- Hard delete within 30 days
- Confirmation of deletion provided

### Data Portability

- Export all data in open formats
- Migration assistance available
- No vendor lock-in

---

## Security Questionnaire Responses

**Common enterprise security questions answered:**

**Q: Where is our data stored?**  
A: AWS US-East-1 (or your chosen region), encrypted at rest.

**Q: Who has access to our data?**  
A: Only your authorized users. DriftSentry staff cannot access customer data without explicit permission (support ticket).

**Q: How long do you retain logs?**  
A: Audit logs: 7 years. Application logs: 90 days.

**Q: Do you support SSO?**  
A: Yes, Enterprise tier includes SAML 2.0, OAuth 2.0, Okta, Azure AD.

**Q: What happens if you get breached?**  
A: Immediate notification (< 72 hours), incident response team mobilized, root cause analysis published.

**Q: Can we get a security audit?**  
A: Yes, SOC 2 Type II in progress. Available Q1 2026.

**Q: Do you have penetration testing?**  
A: Annual penetration tests planned (Q1 2026). Bug bounty program launching soon.

---

## Contact

**Security Team:** security@driftsentry.com  
**Support:** support@driftsentry.com  
**Responsible Disclosure:** Acknowledged within 24 hours

---

**This document is reviewed quarterly and updated as needed.**
