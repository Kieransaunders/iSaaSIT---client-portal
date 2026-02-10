import { expect, test } from '@playwright/test';
import fs from 'node:fs';

const storageStatePath = process.env.PLAYWRIGHT_STORAGE_STATE ?? 'playwright/.auth/user.json';
const hasStorageState = fs.existsSync(storageStatePath);
const staffStorageStatePath =
  process.env.PLAYWRIGHT_STORAGE_STATE_STAFF ?? 'playwright/.auth/staff.json';
const hasStaffStorageState = fs.existsSync(staffStorageStatePath);

test('sign in link points to WorkOS', async ({ page }) => {
  await page.goto('/');
  const signInLink = page.getByRole('link', { name: /sign in/i });
  await expect(signInLink).toHaveAttribute('href', /workos\.com/);
});

test('protected route redirects when logged out', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');

  const currentUrl = page.url();
  const redirectOk = /workos\.com/.test(currentUrl) || /\/$/.test(currentUrl);

  expect(redirectOk, `Unexpected redirect URL: ${currentUrl}`).toBe(true);
});

test.describe('authenticated smoke', () => {
  test.skip(
    !hasStorageState,
    `Missing storage state at ${storageStatePath}. Run "npx playwright codegen --save-storage=${storageStatePath} http://localhost:3000" and sign in once.`,
  );

  test.use({ storageState: storageStatePath });

  test('organization onboarding (if needed)', async ({ page }) => {
    await page.goto('/onboarding');
    await page.waitForLoadState('domcontentloaded');

    const createHeading = page.getByRole('heading', { name: 'Create Your Organization' });
    let needsOnboarding = false;

    try {
      await createHeading.waitFor({ state: 'visible', timeout: 2000 });
      needsOnboarding = true;
    } catch {
      needsOnboarding = false;
    }

    if (!needsOnboarding) {
      await expect(page).toHaveURL(/\/dashboard/);
      return;
    }

    const orgName = `E2E Org ${Date.now()}`;
    const billingEmail =
      process.env.E2E_BILLING_EMAIL ?? `billing+${Date.now()}@example.com`;

    await page.getByLabel('Organization Name').fill(orgName);
    await page.getByLabel('Billing Email').fill(billingEmail);
    await page.getByRole('button', { name: 'Create Organization' }).click();

    await expect(page.getByRole('heading', { name: 'Organization Created!' })).toBeVisible();
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
  });

  test('customer CRUD', async ({ page }) => {
    const customerName = `E2E Customer ${Date.now()}`;
    const customerEmail = `e2e+${Date.now()}@example.com`;
    const updatedNotes = `Updated by e2e ${Date.now()}`;

    await page.goto('/customers');
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();

    await page.getByRole('button', { name: /add customer/i }).click();
    await page.getByLabel('Company Name').fill(customerName);
    await page.getByLabel('Email').fill(customerEmail);
    await page.getByRole('button', { name: /create customer/i }).click();

    await expect(page.getByRole('heading', { name: customerName })).toBeVisible();

    await page.getByPlaceholder('Search customers...').fill(customerName);
    const row = page.getByRole('heading', { name: customerName }).locator('..').locator('..');
    await row.getByRole('button').click();
    await page.getByRole('menuitem', { name: 'View Details' }).click();

    await expect(page).toHaveURL(/\/customers\//);
    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Notes').fill(updatedNotes);
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText(updatedNotes)).toBeVisible();

    await page.goto('/customers');
    await page.getByPlaceholder('Search customers...').fill(customerName);
    const deleteRow = page.getByRole('heading', { name: customerName }).locator('..').locator('..');
    await deleteRow.getByRole('button').click();
    await page.getByRole('menuitem', { name: 'Delete' }).click();

    const confirmDialog = page.getByRole('dialog', { name: 'Delete Customer' });
    await confirmDialog.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByRole('heading', { name: customerName })).toHaveCount(0);
  });
});

test.describe('rbac smoke (staff)', () => {
  test.skip(
    !hasStaffStorageState,
    `Missing staff storage state at ${staffStorageStatePath}. Create a staff account and run "npx playwright codegen --save-storage=${staffStorageStatePath} http://localhost:3000".`,
  );

  test.use({ storageState: staffStorageStatePath });

  test('staff cannot see admin-only actions', async ({ page }) => {
    await page.goto('/customers');
    await expect(page.getByRole('heading', { name: 'Customers' })).toBeVisible();

    const addButton = page.getByRole('button', { name: /add customer/i });
    if ((await addButton.count()) === 0) {
      test.skip(true, 'Add Customer not available for staff role.');
    }

    if (await addButton.isDisabled()) {
      test.skip(true, 'Customer limit reached; cannot create customer as staff.');
    }

    const customerName = `E2E Staff Customer ${Date.now()}`;
    await addButton.click();
    await page.getByLabel('Company Name').fill(customerName);
    await page.getByRole('button', { name: /create customer/i }).click();

    await page.getByPlaceholder('Search customers...').fill(customerName);
    const row = page.getByRole('heading', { name: customerName }).locator('..').locator('..');
    await row.getByRole('button').click();
    await page.getByRole('menuitem', { name: 'View Details' }).click();

    await expect(page).toHaveURL(/\/customers\//);
    await expect(page.getByRole('heading', { name: 'Assigned Staff' })).toHaveCount(0);
  });
});
