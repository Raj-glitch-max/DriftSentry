# 🔧 GITHUB WORKFLOW & GIT BRANCHING STRATEGY
## Complete Guidelines for Phase 7 Development

---

## 📋 OVERVIEW

**Purpose**: Establish professional Git workflow with proper branching, commits, and PRs  
**Team**: You (developer) + Antigravity (Cursor/Claude)  
**Repository**: CloudDrift Guardian  
**Goal**: Production-ready code with full audit trail  

---

## 🌳 BRANCH STRATEGY (Git Flow)

### **Branch Hierarchy**

```
main (Production)
  ↑
  └─ release/v1.0.0 (Release candidates)
        ↑
        └─ develop (Integration branch)
              ↑
              ├─ feature/phase-7-testing (Phase 7 features)
              ├─ feature/backend-tests (Backend tests)
              ├─ feature/frontend-tests (Frontend tests)
              ├─ feature/e2e-tests (E2E tests)
              ├─ feature/ci-cd (CI/CD pipeline)
              ├─ bugfix/test-failures (Bug fixes)
              └─ hotfix/critical-issue (Critical production fixes)
```

### **Branch Naming Convention**

```
Format: <type>/<short-description>

Types:
├─ feature/     → New features (phase-7-backend-unit-tests)
├─ bugfix/      → Bug fixes (bugfix-test-mock-setup)
├─ hotfix/      → Production fixes (hotfix-auth-token-leak)
├─ refactor/    → Code refactoring (refactor-test-structure)
├─ docs/        → Documentation (docs-test-setup-guide)
├─ chore/       → Dependencies, config (chore-update-jest)
└─ ci/          → CI/CD changes (ci-github-actions-setup)

✓ Examples:
  feature/phase-7-backend-unit-tests
  feature/phase-7-frontend-e2e-tests
  bugfix/jest-mock-database
  ci-github-actions-workflow
  docs-testing-guide
```

---

## 📝 COMMIT MESSAGE STANDARDS

### **Format (Conventional Commits)**

```
<type>(<scope>): <subject>

<body>

<footer>
```

### **Types**

```
feat:      New feature (test case added)
fix:       Bug fix (mock corrected)
test:      Adding tests
docs:      Documentation
style:     Code formatting (no logic change)
refactor:  Code refactoring (logic same)
perf:      Performance improvements
chore:     Dependency updates, config
ci:        CI/CD pipeline changes
```

### **Scope (Optional but Recommended)**

```
Examples:
├─ backend
├─ frontend
├─ tests
├─ auth
├─ drifts
├─ alerts
├─ config
├─ ci
└─ docs
```

### **Subject Line Rules**

```
✓ Imperative mood ("add" not "added")
✓ Don't capitalize first letter
✓ No period (.) at end
✓ Max 50 characters
✓ Specific and descriptive
```

### **Body Rules**

```
✓ Wrap at 72 characters
✓ Explain WHAT and WHY, not HOW
✓ Separate from subject with blank line
✓ Use bullet points for multiple changes
```

### **Examples**

```
✅ GOOD:
feat(backend/tests): add auth service unit tests with 10 test cases

- Implement login validation tests
- Add token refresh tests
- Add password hashing tests
- Mock database calls

✅ GOOD:
test(frontend): implement dashboard component tests

- Add render test
- Add data loading test
- Add chart interaction tests
- Add real-time update tests

✅ GOOD:
fix(tests): correct jest mock setup for database

Previous mock was not matching actual API signature.
Updated to use jest-mock-extended for proper typing.

✅ GOOD:
ci: add GitHub Actions workflow for automated tests

- Run tests on PR
- Generate coverage reports
- Block merge if coverage < 95%

❌ BAD:
add tests

❌ BAD:
Fixed stuff

❌ BAD:
backend/tests: Added many test cases for auth service including login validation and token refresh

❌ BAD:
Update package.json
```

---

## 🔄 WORKFLOW: Day-to-Day Operations

### **STEP 1: Start a New Feature**

```bash
# 1. Make sure you're on develop
git checkout develop

# 2. Pull latest changes
git pull origin develop

# 3. Create feature branch
git checkout -b feature/phase-7-backend-unit-tests

# 4. Verify you're on correct branch
git branch
# Should show: * feature/phase-7-backend-unit-tests
```

### **STEP 2: Make Changes & Commit**

```bash
# 1. Create test file
touch backend/tests/unit/services/auth.service.test.ts

# 2. Add content (write test code)
# [Write tests here...]

# 3. Stage changes
git add backend/tests/unit/services/auth.service.test.ts

# 4. Commit with proper message
git commit -m "test(backend/auth): add auth service unit tests

- TEST CASE 1-10: Login validation (email, password, empty fields)
- TEST CASE 11-14: Token refresh (valid, expired, invalid signature)
- TEST CASE 15-16: Logout functionality
- TEST CASE 17-18: Password hashing with bcrypt
- Mocks: Mock database calls with jest.spyOn()
- Coverage: 95%+ for auth service

Related to Phase 7 testing roadmap
"

# 5. Verify commit
git log --oneline -5
```

### **STEP 3: Push Branch to Remote**

```bash
# 1. Push feature branch
git push origin feature/phase-7-backend-unit-tests

# 2. Verify on GitHub
# Go to: https://github.com/yourname/clouddrift-guardian/branches
# Should see your branch listed
```

### **STEP 4: Create Pull Request**

```
ON GITHUB:

1. Navigate to: https://github.com/yourname/clouddrift-guardian
2. Click "Pull requests" tab
3. Click "New pull request" button
4. Select:
   - Base: develop
   - Compare: feature/phase-7-backend-unit-tests
5. Click "Create pull request"
6. Fill in PR details (see template below)
7. Click "Create pull request"
```

### **STEP 5: Code Review & Merge**

```bash
# After PR approval:

1. On GitHub: Click "Merge pull request"
2. Select: "Squash and merge" (recommended for clarity)
3. Delete branch checkbox: ✓ Check it
4. Confirm merge

# Then locally:
git checkout develop
git pull origin develop
git branch -D feature/phase-7-backend-unit-tests
```

---

## 📄 PULL REQUEST TEMPLATE

Create this file: `.github/pull_request_template.md`

```markdown
## 🎯 Description
Brief description of what this PR does.

## 📋 Type of Change
- [ ] Feature (new test cases, new functionality)
- [ ] Bug fix (correcting test, fixing code)
- [ ] Performance improvement
- [ ] Documentation
- [ ] Refactoring

## 🔗 Related Phase
- Phase 7: Testing & Quality Assurance

## 📊 Testing Information

### Test Cases Added
- [ ] Backend unit tests
- [ ] Backend integration tests
- [ ] Frontend unit tests
- [ ] Frontend E2E tests

### Coverage
- Baseline coverage: ___%
- New coverage: ___%
- Target coverage: 95%

### Test Results
- [ ] All tests passing
- [ ] No regressions
- [ ] Coverage target met

## ✅ Checklist

### Code Quality
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No debugging code left
- [ ] TypeScript strict mode: 0 errors

### Testing
- [ ] All new tests passing
- [ ] Existing tests still passing
- [ ] Coverage >= 95%
- [ ] No console.log or debugger left
- [ ] Mocks properly configured

### Documentation
- [ ] README updated (if needed)
- [ ] Inline comments added
- [ ] Complex logic explained
- [ ] Test purposes documented

### Git & Commits
- [ ] Commits follow conventional format
- [ ] Commits are atomic (one logical change per commit)
- [ ] Commit messages are descriptive
- [ ] No merge conflicts

### Security
- [ ] No secrets hardcoded
- [ ] No sensitive data in test fixtures
- [ ] Dependencies checked with npm audit
- [ ] No known vulnerabilities introduced

## 📸 Screenshots/Evidence (if applicable)
- Coverage report: [link or screenshot]
- Test results: [output or screenshot]
- Performance metrics: [if applicable]

## 🚀 Deployment Notes
- Breaking changes: No
- Database migrations: No
- Environment variables needed: No
- Post-deployment steps: None

## 👥 Reviewers
@maintainer-name

## 📌 Additional Notes
Any additional context for reviewers.
```

---

## 📅 DAILY COMMIT PATTERN

### **Day 1: Setup & Backend Unit Tests**

```bash
# Commit 1: Setup
git commit -m "chore: initialize testing infrastructure

- Install Jest, ts-jest, testing libraries
- Create test folder structure
- Add jest.config.js configuration
- Add test setup files

Dependencies added: jest, ts-jest, supertest, jest-mock-extended
"

# Commit 2: Auth service tests
git commit -m "test(backend/auth): implement auth service unit tests

TEST CASES (1-10):
- TEST CASE 1: Valid login returns tokens
- TEST CASE 2: Invalid email throws error
- TEST CASE 3: Invalid password throws error
- TEST CASE 4: Empty fields validation
- TEST CASE 5: Refresh token returns new access token
- TEST CASE 6: Expired refresh token rejected
- TEST CASE 7: Invalid signature rejected
- TEST CASE 8: Logout invalidates token
- TEST CASE 9: Password hashing with bcrypt
- TEST CASE 10: Different salts produce different hashes

Coverage: 95% for auth service
All tests passing: 10/10
"

# Commit 3: Drift service tests
git commit -m "test(backend/drift): implement drift service unit tests

TEST CASES (1-20):
- Pagination tests (4 cases)
- Filtering tests (4 cases)
- Sorting tests (2 cases)
- Approval workflow (4 cases)
- Rejection workflow (3 cases)
- Cost analysis (3 cases)

Coverage: 92% for drift service
All tests passing: 20/20
"

# Commit 4: Repository tests
git commit -m "test(backend/repositories): implement repository tests

- drift.repository.test.ts (15 cases)
- user.repository.test.ts (5 cases)
- alert.repository.test.ts (5 cases)

Coverage: 94% for all repositories
All tests passing: 25/25
"

# Commit 5: Utility tests
git commit -m "test(backend/utils): implement utility function tests

- validators.test.ts (10 cases)
- formatters.test.ts (5 cases)

Coverage: 98% for utils
All tests passing: 15/15

Total backend unit tests: 80
Total unit test coverage: 95%
"
```

### **Day 2-3: Backend Integration Tests**

```bash
# Commit 1
git commit -m "test(backend/auth): add auth routes integration tests

- POST /login (valid, invalid, rate limiting)
- POST /refresh (valid, expired token)
- POST /logout

TEST CASES: 10
Coverage: 96%
All tests passing: 10/10
"

# Commit 2
git commit -m "test(backend/drifts): add drifts routes integration tests

- GET /drifts (auth, pagination, filtering, unauthorized)
- POST /drifts/:id/approve (valid, unauthorized, not found)
- POST /drifts/:id/reject (with reason, missing reason)
- WebSocket events triggered correctly

TEST CASES: 20
Coverage: 95%
All tests passing: 20/20
"

# Commit 3
git commit -m "test(backend/websocket): add websocket integration tests

- drift:created event
- drift:approved event
- alert:created event
- Reconnection handling
- Namespace isolation

TEST CASES: 10
Coverage: 97%
All tests passing: 10/10

Total backend integration tests: 50
Total backend coverage: 95%
"
```

### **Day 4-5: Frontend Unit Tests**

```bash
# Commit 1
git commit -m "test(frontend/auth): add LoginPage component tests

- Render form (10 cases)
- Form validation
- Form submission
- Redirect on success
- Error handling
- Loading state
- Accessibility
- Remember me checkbox

TEST CASES: 10
Coverage: 92%
All tests passing: 10/10
"

# Commit 2
git commit -m "test(frontend/dashboard): add DashboardPage tests

- Render metrics (3 cases)
- Load data (3 cases)
- Charts render (3 cases)
- Real-time updates (3 cases)
- User interactions (3 cases)

TEST CASES: 15
Coverage: 90%
All tests passing: 15/15
"

# Commit 3
git commit -m "test(frontend/drifts): add DriftsList component tests

- Render list (3 cases)
- Pagination (3 cases)
- Filtering (3 cases)
- Sorting (3 cases)
- Actions - approve/reject (3 cases)

TEST CASES: 15
Coverage: 91%
All tests passing: 15/15
"

# Commit 4
git commit -m "test(frontend/hooks): add custom hooks unit tests

- useDrifts hook (10 cases)
- useAuth hook (8 cases)
- useAlerts hook (6 cases)
- useCostTrend hook (4 cases)
- useWebSocket hook (6 cases)

TEST CASES: 34
Coverage: 93%
All tests passing: 34/34

Total frontend unit tests: 70
Total frontend coverage: 91%
"
```

### **Day 6-7: Frontend E2E Tests**

```bash
# Commit 1
git commit -m "test(frontend/e2e): add login flow end-to-end tests

Using Playwright with Chrome, Firefox, Safari

- Full login workflow (2 cases)
- Invalid credentials (2 cases)
- Remember me functionality (2 cases)
- Session persistence (2 cases)
- Logout (1 case)
- Mobile login (1 case)

TEST CASES: 10
Browsers: 3 (Chrome, Firefox, Safari)
All tests passing: 10/10
"

# Commit 2
git commit -m "test(frontend/e2e): add dashboard E2E tests

- Load metrics (2 cases)
- Real-time updates (2 cases)
- Chart interactions (2 cases)
- Navigation (2 cases)
- Mobile viewport (2 cases)

TEST CASES: 10
All tests passing: 10/10
"

# Commit 3
git commit -m "test(frontend/e2e): add drifts workflow E2E tests

- List loading (1 case)
- Pagination (1 case)
- Filtering (1 case)
- Approval workflow (1 case)
- Rejection workflow (1 case)

TEST CASES: 5
All tests passing: 5/5

Total frontend E2E tests: 25
Total frontend tests: 95 (70 unit + 25 E2E)
"
```

### **Day 8-10: Performance, Security, CI/CD**

```bash
# Commit 1
git commit -m "test: add performance audit tests

- Lighthouse score: 92
- FCP: 1.2s (target: < 1.5s) ✓
- LCP: 2.1s (target: < 2.5s) ✓
- TTI: 3.1s (target: < 3.5s) ✓
- Bundle: 142KB (target: < 150KB) ✓
- API p99 latency: 380ms (target: < 500ms) ✓

All performance metrics within targets
"

# Commit 2
git commit -m "test: add security audit scan

- npm audit: 0 critical/high vulnerabilities ✓
- OWASP scan: 0 critical findings ✓
- No secrets in code ✓
- No hardcoded API keys ✓
- All dependencies up-to-date ✓

Security baseline established
"

# Commit 3
git commit -m "ci: add GitHub Actions workflow for automated testing

- Test on PR (lint, unit, integration)
- Generate coverage reports
- Block merge if coverage < 95%
- Run E2E tests on main branches
- Publish test results

Workflow file: .github/workflows/test.yml
"

# Commit 4
git commit -m "docs: add comprehensive testing documentation

- Test setup guide
- How to run tests
- Coverage requirements
- Performance baselines
- CI/CD workflow
- Troubleshooting guide

Files added:
- TESTING.md
- docs/testing-guide.md
- docs/ci-cd-workflow.md
"

# Commit 5
git commit -m "test: update coverage reports and finalize Phase 7

FINAL METRICS:
✅ Total tests: 200+ (80 + 50 + 70)
✅ Code coverage: 95%+ (backend: 95%, frontend: 91%)
✅ Test execution: 28 minutes (target: < 30 min)
✅ Lighthouse: 92 (target: 90+)
✅ OWASP: 0 vulnerabilities
✅ All tests passing: 200/200

Phase 7 Testing & Quality Assurance: COMPLETE ✓

Next: Phase 8 (Integration & Orchestration)
"
```

---

## 🔀 BRANCHING WORKFLOW: Visual Example

### **Phase 7 Branch Structure**

```
main
  ↓
release/v1.0.0-alpha (tagged)
  ↓
develop
  ├─ feature/phase-7-backend-unit-tests (MERGED Day 1-2)
  ├─ feature/phase-7-backend-integration-tests (MERGED Day 3-4)
  ├─ feature/phase-7-frontend-unit-tests (MERGED Day 5)
  ├─ feature/phase-7-frontend-e2e-tests (MERGED Day 6-7)
  ├─ ci/github-actions-testing (MERGED Day 8)
  ├─ docs/testing-guide (MERGED Day 9)
  ├─ chore/update-test-dependencies (MERGED Day 1)
  └─ bugfix/jest-mock-database (if needed during testing)
```

---

## 📊 WHAT ANTIGRAVITY SHOULD DO

### **Instructions to Give Antigravity**

Copy and paste this into Cursor/Claude:

```
GITHUB WORKFLOW RULES FOR PHASE 7

CRITICAL: You MUST follow Git Flow branching and commit standards.
NEVER push directly to main or develop.
ALWAYS create PRs and let me review before merging.

BRANCHING RULES:
✓ Create feature branch from develop
✓ Branch format: feature/phase-7-[feature-name]
✓ Example: feature/phase-7-backend-unit-tests
✓ NEVER commit to develop or main directly

COMMIT RULES:
✓ Use conventional commits format
✓ Format: type(scope): subject
  - type: feat, test, fix, ci, docs, chore
  - scope: backend, frontend, tests, auth, config
  - subject: imperative mood, max 50 chars, no period
✓ Add detailed body for complex changes
✓ Each commit = one logical change
✓ Examples:
  ✓ "test(backend/auth): add auth service unit tests"
  ✓ "test(frontend): add LoginPage component tests"
  ✓ "ci: add GitHub Actions workflow"
  ✗ "add tests"
  ✗ "update code"

PULL REQUEST RULES:
✓ Create PR from feature branch → develop
✓ NEVER merge your own PR
✓ Fill in PR template completely
✓ Wait for review and approval
✓ After approval, I'll merge
✓ Title format: [PHASE-7] Brief description
✓ Example: [PHASE-7] Add backend unit tests (80 cases)

DAILY WORKFLOW:
1. Create branch: git checkout -b feature/[name]
2. Make changes and test locally
3. Commit with proper message: git commit -m "..."
4. Push to GitHub: git push origin feature/[name]
5. Create PR on GitHub
6. Wait for approval
7. I will merge after review

TEST EXECUTION:
- Run tests locally before committing
- Verify coverage: npm run test:coverage
- All tests must pass: npm run test
- No console.log or debugger statements

COMMIT MESSAGE EXAMPLES (Copy these exactly):

Backend unit tests:
git commit -m "test(backend/auth): add auth service unit tests

- TEST CASE 1-4: Login validation
- TEST CASE 5-8: Token refresh
- TEST CASE 9-10: Logout & hashing

Coverage: 95% for auth service
All tests passing: 10/10"

Frontend tests:
git commit -m "test(frontend): add LoginPage component tests

- TEST CASE 1-3: Form rendering
- TEST CASE 4-6: Form validation
- TEST CASE 7-10: Submission & errors

Coverage: 92% for LoginPage
All tests passing: 10/10"

Setup/Config:
git commit -m "chore: initialize testing infrastructure

- Install Jest and Vitest
- Create test folder structure
- Add configuration files

Dependencies: jest, ts-jest, vitest, @testing-library/react"

CI/CD:
git commit -m "ci: add GitHub Actions workflow for testing

- Run tests on PR
- Generate coverage reports
- Block merge if coverage < 95%"

DON'T create commits like:
✗ "add tests"
✗ "fixed bugs"
✗ "update backend"
✗ "WIP"

REPOSITORY LINK:
[I will provide GitHub repo URL]

IMPORTANT:
- NEVER push to main or develop
- NEVER force push (git push -f)
- ALWAYS create PRs
- Wait for my approval before merging
- Keep feature branches focused (one feature per branch)
- Delete branch after merging

Questions? Ask me before committing.
```

---

## 🛠️ COMMAND REFERENCE

### **Essential Git Commands**

```bash
# Check current branch
git branch
git status

# Create new branch
git checkout -b feature/phase-7-backend-unit-tests

# Switch branches
git checkout develop
git checkout feature/phase-7-backend-unit-tests

# Stage files
git add backend/tests/unit/services/auth.service.test.ts
git add .                                          # Stage all

# Commit with message
git commit -m "test(backend/auth): add auth tests"

# View commit history
git log --oneline -10
git log --graph --oneline --all

# Push to remote
git push origin feature/phase-7-backend-unit-tests

# Pull latest from remote
git pull origin develop

# Delete local branch (after merge)
git branch -D feature/phase-7-backend-unit-tests

# Delete remote branch
git push origin --delete feature/phase-7-backend-unit-tests

# Stash changes (save but don't commit)
git stash
git stash pop

# View diff before committing
git diff
git diff --staged

# Revert last commit (keep changes)
git reset --soft HEAD~1

# Revert last commit (discard changes)
git reset --hard HEAD~1

# Cherry-pick specific commit
git cherry-pick <commit-hash>

# Rebase on develop (before creating PR)
git fetch origin
git rebase origin/develop
```

### **If Something Goes Wrong**

```bash
# Accidentally committed to wrong branch?
git reset --soft HEAD~1           # Undo last commit
git stash                          # Save changes
git checkout correct-branch
git stash pop
git commit -m "..."

# Accidentally pushed to wrong branch?
git push origin --delete wrong-branch  # Delete remote
git reset --hard HEAD~1           # Delete local

# Merge conflicts when pulling?
# Fix files manually, then:
git add .
git commit -m "fix: resolve merge conflicts"
git push origin feature-branch

# Need to undo a push?
# Contact me immediately - never use force push
```

---

## 📋 PR REVIEW CHECKLIST

**Before asking for review, verify:**

- [ ] All tests passing locally (`npm run test`)
- [ ] Coverage >= 95% (`npm run test:coverage`)
- [ ] No TypeScript errors (`npm run type-check` or `npx tsc --noEmit`)
- [ ] No linting errors (`npm run lint`)
- [ ] No console.log or debugger statements
- [ ] Commits follow conventional format
- [ ] PR description is detailed
- [ ] No merge conflicts
- [ ] Branch is up to date with develop
- [ ] Tests added for new code

---

## 🚀 REPOSITORY SETUP (For You)

### **Create Branch Protection Rules**

On GitHub: Settings → Branches → Add rule

```
Branch name pattern: develop
✓ Require pull request reviews before merging
✓ Require at least 1 approval
✓ Require status checks to pass before merging
  - Test workflow must pass
  - Coverage must be >= 95%
✓ Require branches to be up to date before merging
✓ Include administrators (unchecked - you can override)
```

```
Branch name pattern: main
✓ Require pull request reviews before merging
✓ Require at least 2 approvals
✓ Require status checks to pass before merging
✓ Require branches to be up to date before merging
✓ Require conversation resolution before merging
✓ Include administrators (unchecked)
✓ Restrict who can push to matching branches (you only)
```

### **Setup GitHub Actions**

Create: `.github/workflows/test.yml`

```yaml
name: Test

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install
      
      - name: Run linter
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint
      
      - name: Run tests
        run: |
          cd backend && npm run test:coverage
          cd ../frontend && npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/coverage-final.json,./frontend/coverage/coverage-final.json
```

---

## 📞 FAQ & TROUBLESHOOTING

### **Q: I committed to the wrong branch. What do I do?**

```bash
A: 
1. git reset --soft HEAD~1  # Undo commit, keep changes
2. git stash               # Save changes
3. git checkout develop    # Switch to correct branch
4. git pull origin develop # Update
5. git checkout -b feature/correct-name
6. git stash pop           # Apply saved changes
7. git commit -m "..."
8. git push origin feature/correct-name
```

### **Q: How do I keep my feature branch updated with develop?**

```bash
A:
1. git fetch origin        # Get latest
2. git rebase origin/develop
# Resolve any conflicts if needed
3. git push origin feature/branch-name --force-with-lease
```

### **Q: I need to make changes after creating a PR?**

```bash
A: Just commit and push to the same branch:
1. Make changes
2. git add .
3. git commit -m "..."
4. git push origin feature/branch-name
# PR will auto-update
```

### **Q: Can I delete my feature branch?**

```bash
A: Yes, after it's merged to develop:
1. Locally: git branch -D feature/branch-name
2. Remotely: git push origin --delete feature/branch-name
```

### **Q: What if tests fail on the PR?**

```bash
A:
1. Check GitHub Actions log for error details
2. Fix the issue locally
3. Run tests: npm run test
4. Commit: git commit -m "fix: correct test issue"
5. Push: git push origin feature/branch-name
6. PR updates automatically
```

### **Q: Can I rebase or squash commits?**

```bash
A: For Phase 7, keep commits atomic:
✓ One logical change per commit
✓ Keep descriptive messages
✓ Don't squash until merge

When merging PR to develop:
- I'll do "Squash and merge" for clean history
```

---

## 📊 EXAMPLE PR DESCRIPTION

```markdown
## [PHASE-7] Add Backend Unit Tests for Auth Service

### Description
Implements comprehensive unit tests for authentication service covering login, 
token refresh, logout, and password hashing functionality.

### Type of Change
- [x] Test (new test cases)
- [ ] Feature
- [ ] Bug fix
- [ ] Documentation

### Related Phase
Phase 7: Testing & Quality Assurance

### Test Cases Added
- TEST CASE 1-4: Login validation (email, password, empty fields)
- TEST CASE 5-8: Token refresh (valid, expired, invalid signature)
- TEST CASE 9: Logout functionality
- TEST CASE 10: Password hashing with bcrypt

### Coverage
- Previous: 45%
- Now: 95%
- Target: 95% ✓

### Test Results
```
✓ PASS  auth.service.test.ts (10 tests)
  ✓ Should validate email format
  ✓ Should validate password strength
  ✓ Should return tokens on login
  ✓ Should refresh valid token
  ✓ Should reject expired token
  ✓ Should logout user
  ✓ Should hash password
  ✓ Should verify hashed password

Tests:       10 passed, 10 total
Coverage:    Lines 95% | Branches 94% | Functions 95%
Duration:    2.341s
```

### Checklist
- [x] All tests passing
- [x] Coverage >= 95%
- [x] No console.log statements
- [x] TypeScript: 0 errors
- [x] Commits follow conventional format
- [x] PR template filled
- [x] No merge conflicts

### Breaking Changes
None

### Notes
Auth service now has comprehensive test coverage. Mocks properly configured 
for database calls. Ready for integration tests.

### Related Issues
#123 Phase 7: Testing & Quality Assurance

---
**Ready for review** ✓
```

---

## 🎯 FINAL CHECKLIST FOR ANTIGRAVITY

Before asking for review on any PR:

```
✓ Read this document completely
✓ Understand Git Flow branching
✓ Understand conventional commits
✓ Set up local Git configuration:
  git config --global user.name "Your Name"
  git config --global user.email "email@example.com"
✓ Clone repository
✓ Create feature branch from develop
✓ Write tests/code in feature branch
✓ Run tests locally and verify passing
✓ Check coverage: npm run test:coverage
✓ Commit with proper message format
✓ Push to remote
✓ Create PR with filled template
✓ Wait for review
✓ DON'T merge your own PR
✓ DON'T push to main or develop
✓ DON'T force push (except force-with-lease)
✓ DON'T skip any test cases
✓ DON'T reduce coverage targets
```

---

**Follow these guidelines exactly. They ensure code quality, 
audit trail, and professional development practices. 🚀**
