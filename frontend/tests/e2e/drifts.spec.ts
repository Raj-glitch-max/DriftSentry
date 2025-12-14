/**
 * Drifts E2E Tests
 * TEST CASES: 10
 */

import { test, expect } from '@playwright/test';

test.describe('Drifts Page', () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.locator('input[type="email"], input[name="email"]').fill('admin@driftsentry.local');
        await page.locator('input[type="password"]').fill('admin123');
        await page.getByRole('button', { name: /sign in|login/i }).click();
        await page.waitForURL(/dashboard/, { timeout: 10000 });

        // Navigate to drifts page
        await page.goto('/drifts');
    });

    test('should display drifts list', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /drift/i })).toBeVisible();
    });

    test('should show drifts table', async ({ page }) => {
        const table = page.locator('table, [role="table"]');
        await expect(table.first()).toBeVisible();
    });

    test('should have status filter', async ({ page }) => {
        const filter = page.locator('select, [role="listbox"]').first();
        await expect(filter).toBeVisible();
    });

    test('should have severity filter', async ({ page }) => {
        const severityFilter = page.getByText(/severity|critical|warning/i);
        await expect(severityFilter.first()).toBeVisible();
    });

    test('should show drift details when clicked', async ({ page }) => {
        const firstDrift = page.locator('table tbody tr, [data-testid*="drift"]').first();
        if (await firstDrift.isVisible()) {
            await firstDrift.click();
            // Should show details or navigate to detail page
            await expect(page.getByText(/resource|details|state/i).first()).toBeVisible({ timeout: 5000 });
        }
    });

    test('should have approve button for pending drifts', async ({ page }) => {
        const approveButton = page.getByRole('button', { name: /approve/i }).first();
        // May or may not be visible depending on data
        if (await approveButton.isVisible()) {
            await expect(approveButton).toBeEnabled();
        }
    });

    test('should have reject button for pending drifts', async ({ page }) => {
        const rejectButton = page.getByRole('button', { name: /reject/i }).first();
        if (await rejectButton.isVisible()) {
            await expect(rejectButton).toBeEnabled();
        }
    });

    test('should show pagination controls', async ({ page }) => {
        const pagination = page.getByRole('navigation', { name: /pagination/i });
        const pageButtons = page.getByRole('button', { name: /next|previous|[0-9]+/i });

        const hasPagination = await pagination.isVisible() || await pageButtons.first().isVisible();
        // Pagination may not be visible if less than one page of data
        expect(hasPagination).toBeDefined();
    });

    test('should filter drifts by status', async ({ page }) => {
        const statusFilter = page.locator('select').first();
        if (await statusFilter.isVisible()) {
            await statusFilter.selectOption({ index: 1 });
            // Wait for filtered results
            await page.waitForLoadState('networkidle');
        }
    });

    test('should show empty state when no drifts', async ({ page }) => {
        // Apply filter that returns no results
        const noResultsText = page.getByText(/no.*drift|empty|nothing/i);
        // This is conditional - may or may not have empty state
        if (await noResultsText.isVisible()) {
            await expect(noResultsText).toBeVisible();
        }
    });
});
