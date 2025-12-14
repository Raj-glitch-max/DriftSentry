# 🎬 PROMPT: WHAT TO TELL ANTIGRAVITY (Cursor/Claude) ABOUT GITHUB
## Copy & Paste This Exact Text When Setting Up Phase 7

---

## 📌 COPY THIS ENTIRE SECTION & PASTE INTO CURSOR/CLAUDE

```
========================================
GITHUB WORKFLOW FOR CLOUDDRIFT GUARDIAN
========================================

CRITICAL INSTRUCTIONS:
You are working on the CloudDrift Guardian project (Phase 7: Testing & QA).
You MUST follow Git Flow branching and professional commit standards.
You will NEVER push directly to main or develop branches.
You will ALWAYS create Pull Requests (PRs) for code review.

REPOSITORY LINK:
https://github.com/YOUR_USERNAME/clouddrift-guardian
(I will provide this when you're ready)

═══════════════════════════════════════════════════════════════

1️⃣ INITIAL SETUP (Do this ONCE)

After I share the repository link:

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/clouddrift-guardian.git
cd clouddrift-guardian

# Verify you're on develop
git branch
# Output should show: * develop (or similar)

# Set your Git configuration (if not already done)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Pull latest changes
git pull origin develop
```

═══════════════════════════════════════════════════════════════

2️⃣ BRANCHING RULES

RULE 1: Always create a feature branch
├─ Source: develop (NEVER main)
├─ Format: feature/phase-7-[description]
├─ Examples:
│  ✓ feature/phase-7-backend-unit-tests
│  ✓ feature/phase-7-frontend-e2e-tests
│  ✓ feature/phase-7-performance-tests
│  ✗ feature/tests (TOO VAGUE)
│  ✗ phase-7-tests (MISSING feature/ prefix)

RULE 2: Create branch and switch to it
```bash
git checkout -b feature/phase-7-backend-unit-tests
```

RULE 3: Verify you're on the correct branch
```bash
git branch
# Output: * feature/phase-7-backend-unit-tests
```

RULE 4: NEVER commit to develop or main directly
✗ Don't do: git commit (while on develop)
✓ Always do: Create feature branch first

═══════════════════════════════════════════════════════════════

3️⃣ COMMIT MESSAGE STANDARDS (VERY IMPORTANT)

Format: type(scope): subject

Types:
- feat: New feature or test case
- fix: Bug fix
- test: Adding/updating tests
- docs: Documentation
- chore: Setup, dependencies, config
- ci: CI/CD changes
- refactor: Code refactoring
- perf: Performance improvements

Scope (optional but recommended):
- backend, frontend, auth, drifts, alerts, tests, config

Subject:
- Imperative mood ("add" not "added")
- No capitalization at start
- No period at end
- Max 50 characters
- Specific and descriptive

Body (optional for small commits, required for large ones):
- Wrap at 72 characters
- Explain WHAT and WHY
- Use bullet points for multiple items

───────────────────────────────────────

✅ GOOD COMMIT MESSAGES:

"test(backend/auth): add auth service unit tests

- TEST CASE 1-4: Login validation (email, password, empty)
- TEST CASE 5-8: Token refresh (valid, expired, invalid)
- TEST CASE 9-10: Logout and password hashing

Coverage increased from 45% to 95%
All tests passing: 10/10"

"test(frontend): add LoginPage component tests

- Render form with input fields
- Validate email and password
- Submit form and redirect on success
- Show error messages
- Handle loading states

Coverage: 92% for LoginPage component
Tests: 10 cases, all passing"

"ci: add GitHub Actions workflow for testing

Automated testing on every PR:
- Run lint checks
- Execute unit tests
- Generate coverage reports
- Block merge if coverage < 95%

Workflow file: .github/workflows/test.yml"

❌ BAD COMMIT MESSAGES:

"add tests"
"fixed stuff"
"update backend"
"Backend/Tests: Added many test cases"
"WIP"
"temp"

───────────────────────────────────────

ACTUAL COMMAND TO COMMIT:

```bash
# Stage your changes
git add .

# Commit with proper message
git commit -m "test(backend/auth): add auth service unit tests

- TEST CASE 1: Valid login returns tokens
- TEST CASE 2-3: Email/password validation
- TEST CASE 4: Empty fields handling
- TEST CASE 5-8: Token refresh scenarios
- TEST CASE 9: Logout functionality
- TEST CASE 10: Password hashing

Coverage: 95% for auth service
All tests passing: 10/10"

# Verify your commit was recorded
git log --oneline -3
```

═══════════════════════════════════════════════════════════════

4️⃣ DAILY WORKFLOW

Step 1: Create Branch (DAY 1 only)
```bash
git checkout develop
git pull origin develop
git checkout -b feature/phase-7-backend-unit-tests
```

Step 2: Make Changes & Commit (DAILY)
```bash
# 1. Write test code in your editor
# 2. Run tests locally to verify they pass
npm run test
npm run test:coverage  # Check coverage >= 95%

# 3. Stage changes
git add backend/tests/unit/services/auth.service.test.ts
# or
git add .  # Add all changes

# 4. Commit with proper message (see examples above)
git commit -m "test(backend/auth): add auth service unit tests

[detailed body here]"

# 5. Verify commit
git log --oneline -5
```

Step 3: Push to Remote (DAILY after committing)
```bash
git push origin feature/phase-7-backend-unit-tests
```

Step 4: Create Pull Request (WHEN FEATURE COMPLETE)
- Go to: https://github.com/YOUR_USERNAME/clouddrift-guardian
- Click: "Pull requests" tab
- Click: "New pull request" button
- Select:
  - Base: develop
  - Compare: feature/phase-7-backend-unit-tests
- Fill in PR template (provided below)
- Click: "Create pull request"

Step 5: Wait for Review & Approval
- I will review your PR
- Provide feedback if needed
- Approve when ready

Step 6: Merge (I WILL DO THIS, not you)
- I will merge PR to develop
- I will delete feature branch
- You then pull latest develop

═══════════════════════════════════════════════════════════════

5️⃣ PULL REQUEST TEMPLATE

When creating a PR, fill this out completely:

---

## 🎯 Description
Brief description of what this PR does.

Example:
"Implements comprehensive unit tests for the auth service, covering login, 
token refresh, logout, and password hashing functionality."

## 📋 Type of Change
- [x] Test (new test cases)
- [ ] Feature
- [ ] Bug fix
- [ ] Documentation

## 🔗 Related Phase
Phase 7: Testing & Quality Assurance

## 📊 Testing Information

### Test Cases Added
- [x] Backend unit tests
- [ ] Backend integration tests
- [ ] Frontend unit tests
- [ ] Frontend E2E tests

### Coverage
- Baseline coverage: 45%
- New coverage: 95%
- Target coverage: 95% ✓

### Test Results
- [x] All tests passing
- [x] No regressions
- [x] Coverage target met

## ✅ Checklist

- [x] All new tests passing
- [x] Existing tests still passing
- [x] Coverage >= 95%
- [x] Commits follow conventional format
- [x] No console.log or debugger left
- [x] TypeScript: 0 errors
- [x] No merge conflicts

---

═══════════════════════════════════════════════════════════════

6️⃣ EXAMPLE: COMPLETE DAY 1 WORKFLOW

Morning: Start Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/phase-7-backend-unit-tests
git branch
# Shows: * feature/phase-7-backend-unit-tests ✓
```

During Day: Write Tests
```bash
# Write auth.service.test.ts
# - TEST CASE 1-10 (see Phase 7 spec)
# - All mocks configured
# - Coverage 95%

# Run tests
npm run test
npm run test:coverage
# Output: ✓ 10 passed | Coverage: 95% ✓
```

End of Day: Commit & Push
```bash
git add backend/tests/unit/services/auth.service.test.ts
git commit -m "test(backend/auth): add auth service unit tests

- TEST CASE 1-4: Login validation (email, password, empty fields)
- TEST CASE 5-8: Token refresh (valid, expired, invalid signature)
- TEST CASE 9: Logout functionality
- TEST CASE 10: Password hashing with bcrypt

Coverage: 95% for auth service
All tests passing: 10/10"

git push origin feature/phase-7-backend-unit-tests

# GitHub shows: "1 commit, branch ready to compare & pull request"
```

After Feature Complete: Create PR
```
- Go to GitHub: https://github.com/.../pull/new/feature/phase-7-backend-unit-tests
- Fill PR template with test details
- Add description of what tests were added
- Click "Create pull request"
- Wait for my review
```

═══════════════════════════════════════════════════════════════

7️⃣ IMPORTANT RULES (MUST FOLLOW)

✓ DO:
├─ Create feature branch from develop
├─ Write descriptive commit messages
├─ Run tests before committing
├─ Push feature branch to remote
├─ Create PRs for code review
├─ Wait for approval before merging
├─ Keep commits atomic (one logical change per commit)
├─ Use conventional commit format

✗ DON'T:
├─ Commit to main or develop directly
├─ Use vague commit messages ("add tests", "fix bugs")
├─ Force push (git push -f) - unless I tell you
├─ Merge your own PR
├─ Commit without running tests
├─ Skip coverage checks
├─ Commit console.log or debugger statements
├─ Mix unrelated changes in one commit

═══════════════════════════════════════════════════════════════

8️⃣ IF SOMETHING GOES WRONG

Problem: Committed to wrong branch?
Solution:
```bash
git reset --soft HEAD~1  # Undo, keep changes
git stash               # Save changes
git checkout feature-branch
git stash pop           # Apply changes
git commit -m "..."
git push origin feature-branch
```

Problem: PR has merge conflicts?
Solution:
```bash
git fetch origin
git rebase origin/develop
# Fix conflicts in files
git add .
git commit -m "fix: resolve merge conflicts"
git push origin feature-branch --force-with-lease
```

Problem: Need to update PR after review?
Solution:
```bash
# Make changes
git add .
git commit -m "fix: address review comments"
git push origin feature-branch
# PR auto-updates
```

Problem: Want to discard uncommitted changes?
Solution:
```bash
git status  # See what changed
git checkout .  # Discard all changes
# or
git checkout -- file.ts  # Discard specific file
```

═══════════════════════════════════════════════════════════════

9️⃣ DAILY COMMIT PATTERN FOR PHASE 7

Day 1-2: Backend Unit Tests
├─ Commit 1: "chore: initialize testing infrastructure"
├─ Commit 2: "test(backend/auth): add auth service unit tests"
├─ Commit 3: "test(backend/drift): add drift service unit tests"
├─ Commit 4: "test(backend/repositories): add repository tests"
└─ Commit 5: "test(backend/utils): add utility function tests"

Day 3-4: Backend Integration Tests
├─ Commit 1: "test(backend/auth): add auth routes integration tests"
├─ Commit 2: "test(backend/drifts): add drifts routes integration tests"
└─ Commit 3: "test(backend/websocket): add websocket integration tests"

Day 5-6: Frontend Unit Tests
├─ Commit 1: "test(frontend/auth): add LoginPage component tests"
├─ Commit 2: "test(frontend/dashboard): add DashboardPage tests"
├─ Commit 3: "test(frontend/drifts): add DriftsList component tests"
└─ Commit 4: "test(frontend/hooks): add custom hooks unit tests"

Day 7-8: Frontend E2E Tests
├─ Commit 1: "test(frontend/e2e): add login flow end-to-end tests"
├─ Commit 2: "test(frontend/e2e): add dashboard E2E tests"
└─ Commit 3: "test(frontend/e2e): add drifts workflow E2E tests"

Day 9-10: Performance & CI/CD
├─ Commit 1: "test: add performance audit tests"
├─ Commit 2: "test: add security audit scan"
├─ Commit 3: "ci: add GitHub Actions workflow for testing"
└─ Commit 4: "docs: add comprehensive testing documentation"

═══════════════════════════════════════════════════════════════

🔟 GIT COMMANDS REFERENCE

Check status:
  git status
  git branch
  
Create/switch branch:
  git checkout -b feature/name
  git checkout develop
  
Stage & commit:
  git add .
  git add file.ts
  git commit -m "message"
  
Push & pull:
  git push origin feature-branch
  git pull origin develop
  
View history:
  git log --oneline -10
  git log --graph --oneline --all
  
Undo changes:
  git reset --soft HEAD~1  (undo, keep changes)
  git stash                (save changes)
  git stash pop            (restore changes)
  
Delete branch:
  git branch -D local-branch
  git push origin --delete remote-branch

═══════════════════════════════════════════════════════════════

FINAL CHECKLIST

Before creating PR, verify:
□ All tests passing locally (npm run test)
□ Coverage >= 95% (npm run test:coverage)
□ No TypeScript errors (npx tsc --noEmit)
□ No console.log or debugger statements
□ Commits use conventional format
□ Branch is up to date with develop
□ No merge conflicts
□ PR template will be filled completely
□ All test cases documented
□ Changes are focused on one feature

═══════════════════════════════════════════════════════════════

REPOSITORY WILL BE PROVIDED:
[I will give you the link when ready to start]

START AFTER:
1. Clone repository
2. Verify you can run tests locally
3. Create feature branch
4. Begin Phase 7 implementation

Questions? Ask before committing/pushing.
```

═══════════════════════════════════════════════════════════════

---

## 🎯 HOW TO USE THIS DOCUMENT

**When you're ready to start Phase 7:**

1. **Copy the entire section above** (from "GITHUB WORKFLOW FOR CLOUDDRIFT GUARDIAN" to the end)

2. **Paste it into Cursor/Claude** exactly as is

3. **Add at the end:**
   ```
   Repository: [GitHub URL you will provide]
   
   I will give you the link when you're ready.
   
   Now, proceed with Phase 7 following the specification in:
   - phase-7-testing-prompt.md (detailed test cases)
   - phase-7-complete-spec.md (overview)
   - phase-7-quick-start.md (commands)
   
   BUT follow Git Flow & commit standards from above.
   Create PRs, wait for review, don't push directly to main/develop.
   ```

4. **Share the repository link** when Antigravity confirms understanding

---

## ✅ VERIFICATION CHECKLIST

Before giving this to Antigravity, verify:

- [ ] You have created the GitHub repository
- [ ] You have a `develop` branch (not just `main`)
- [ ] Branch protection is configured (if desired)
- [ ] `.github/pull_request_template.md` is in place
- [ ] `.gitignore` includes node_modules, coverage, .env
- [ ] Repository is readable/writable by Antigravity

**Example `.gitignore` for CloudDrift Guardian:**

```
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Testing
coverage/
.nyc_output

# Build
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*

# Misc
.cache/
temp/
tmp/
```

---

## 📞 MONITORING ANTIGRAVITY'S WORK

You can track progress by:

1. **GitHub Branches**: See all active branches
   - https://github.com/yourname/clouddrift-guardian/branches

2. **GitHub Commits**: Review commit messages
   - https://github.com/yourname/clouddrift-guardian/commits/develop

3. **Pull Requests**: Review each PR before merging
   - https://github.com/yourname/clouddrift-guardian/pulls

4. **Actions/Workflow**: Check test results
   - https://github.com/yourname/clouddrift-guardian/actions

---

**Ready to share with Antigravity? You have everything needed! 🚀**
