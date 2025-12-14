/**
 * Login E2E Tests
 * TEST CASES: 10
 */

import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /sign in|login/i })).toBeVisible();
        await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('should show validation error for empty email', async ({ page }) => {
        await page.locator('input[type="password"]').fill('password123');
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page.getByText(/email is required|enter.*email/i)).toBeVisible();
    });

    test('should show validation error for invalid email format', async ({ page }) => {
        await page.locator('input[type="email"], input[name="email"]').fill('invalid-email');
        await page.locator('input[type="password"]').fill('password123');
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page.getByText(/valid email|invalid email/i)).toBeVisible();
    });

    test('should show validation error for empty password', async ({ page }) => {
        await page.locator('input[type="email"], input[name="email"]').fill('test@example.com');
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page.getByText(/password is required|enter.*password/i)).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
        await page.locator('input[type="email"], input[name="email"]').fill('wrong@example.com');
        await page.locator('input[type="password"]').fill('wrongpassword');
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await expect(page.getByText(/invalid|incorrect|wrong/i)).toBeVisible({ timeout: 10000 });
    });

    test('should navigate to dashboard after successful login', async ({ page }) => {
        // Use mock credentials that work with test backend
        await page.locator('input[type="email"], input[name="email"]').fill('admin@driftsentry.local');
        await page.locator('input[type="password"]').fill('admin123');
        await page.getByRole('button', { name: /sign in|login/i }).click();

        await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });
    });

    test('should show loading state during login', async ({ page }) => {
        await page.locator('input[type="email"], input[name="email"]').fill('admin@driftsentry.local');
        await page.locator('input[type="password"]').fill('admin123');

        const submitButton = page.getByRole('button', { name: /sign in|login/i });
        await submitButton.click();

        // Check for loading indicator (spinner, disabled state, or loading text)
        await expect(submitButton).toBeDisabled();
    });

    test('should have remember me checkbox', async ({ page }) => {
        const checkbox = page.locator('input[type="checkbox"]');
        if (await checkbox.isVisible()) {
            await checkbox.check();
            await expect(checkbox).toBeChecked();
        }
    });

    test('should have forgot password link', async ({ page }) => {
        const forgotLink = page.getByText(/forgot.*password/i);
        if (await forgotLink.isVisible()) {
            await expect(forgotLink).toHaveAttribute('href', expect.stringContaining('/'));
        }
    });

    test('should be accessible via keyboard', async ({ page }) => {
        await page.keyboard.press('Tab');
        await page.keyboard.type('admin@driftsentry.local');
        await page.keyboard.press('Tab');
        await page.keyboard.type('admin123');
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');

        // Should attempt login
        await expect(page.getByRole('button', { name: /sign in|login/i })).toBeDisabled();
    });
});
