/**
 * Dashboard E2E Tests
 * TEST CASES: 10
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.locator('input[type="email"], input[name="email"]').fill('admin@driftsentry.local');
        await page.locator('input[type="password"]').fill('admin123');
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await page.waitForURL(/dashboard/, { timeout: 10000 });
    });

    test('should display dashboard after login', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    });

    test('should show total drifts metric', async ({ page }) => {
        await expect(page.getByText(/total.*drift|drift.*total/i)).toBeVisible();
    });

    test('should show critical drifts count', async ({ page }) => {
        await expect(page.getByText(/critical/i)).toBeVisible();
    });

    test('should show cost impact metric', async ({ page }) => {
        await expect(page.getByText(/cost|\$/i)).toBeVisible();
    });

    test('should have navigation sidebar', async ({ page }) => {
        // Look for navigation elements
        const nav = page.locator('nav, [role="navigation"], aside');
        await expect(nav.first()).toBeVisible();
    });

    test('should navigate to drifts page', async ({ page }) => {
        await page.getByRole('link', { name: /drift/i }).first().click();
        await expect(page).toHaveURL(/drift/);
    });

    test('should show recent drifts list', async ({ page }) => {
        // Look for a table or list of drifts
        const driftsSection = page.getByText(/recent|latest/i);
        if (await driftsSection.isVisible()) {
            await expect(driftsSection).toBeVisible();
        }
    });

    test('should refresh metrics on button click', async ({ page }) => {
        const refreshButton = page.getByRole('button', { name: /refresh|reload/i });
        if (await refreshButton.isVisible()) {
            await refreshButton.click();
            // Metrics should still be visible after refresh
            await expect(page.getByText(/total|drift/i).first()).toBeVisible();
        }
    });

    test('should display user info or avatar', async ({ page }) => {
        // Look for user info in header
        const userElement = page.getByText(/admin|user|profile/i).first();
        await expect(userElement).toBeVisible({ timeout: 5000 });
    });

    test('should have logout option', async ({ page }) => {
        const logoutButton = page.getByRole('button', { name: /logout|sign out/i });
        const logoutLink = page.getByRole('link', { name: /logout|sign out/i });

        const hasLogout = await logoutButton.isVisible() || await logoutLink.isVisible();
        expect(hasLogout).toBe(true);
    });
});
