import { type BrowserContext, chromium } from '@playwright/test';
import path from 'path';

import { createTestAnnotation } from '@trezor/e2e-utils';

import { mockRemoteMessageSystem } from '../../support/common';
import { expect, test } from '../../support/fixtures';
import { AnalyticsSection } from '../../support/pageObjects/analyticsSection';
import { ConnectPermissionsModal } from '../../support/pageObjects/connectPermissionsModal';
import { DevicePrompt } from '../../support/pageObjects/devicePrompt';
import { OnboardingPage } from '../../support/pageObjects/onboarding/onboardingPage';
import { SettingsPage } from '../../support/pageObjects/settings/settingsPage';
import { enhancePage } from '../../support/testExtends/enhancePage';

function getSuiteWebUrl() {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
        // Local development
        return 'http://localhost:8000';
    }

    // Extract branch from BASE_URL (e.g., "https://dev.suite.sldev.cz/suite-web/develop/web" -> "develop")
    const branchMatch = baseUrl.match(/suite-web\/(.*?)\/web\/?$/);
    if (branchMatch) {
        return `https://dev.suite.sldev.cz/suite-web/${branchMatch[1]}/web`;
    }

    return 'http://localhost:8000';
}

const suiteWebUrl = getSuiteWebUrl();

/**
 * Launch a browser with the Connect Explorer webextension loaded, complete Suite Web onboarding,
 * navigate to the getAddress method page, and open the Suite popup by clicking submit.
 * Returns the browser context, the extension popup page, the Suite page, and the permissions modal.
 */
async function setupWebextensionTest(
    model: unknown,
    device: any,
    defaultContext: BrowserContext,
    userDataDirSuffix: string,
    { skipPermissionConfirm = false } = {},
) {
    await defaultContext.close();

    const extensionPath = path.join(
        __dirname,
        '../../../../packages/connect-explorer/build-webextension',
    );

    const userDataDir = path.join(test.info().outputDir, userDataDirSuffix);
    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        args: [
            process.env.CI ? `--headless=new` : '',
            `--disable-extensions-except=${extensionPath}`,
            `--load-extension=${extensionPath}`,
        ],
        viewport: { width: 1280, height: 720 },
        permissions: ['local-network-access'],
    });

    await context.addInitScript(() => {
        (window as any).Playwright = true;
    });

    // Complete onboarding on Suite Web first
    const onboardingPage = await context.newPage();
    enhancePage(onboardingPage);

    await onboardingPage.goto(suiteWebUrl, {
        timeout: 30000,
        waitUntil: 'load',
    });

    await onboardingPage.locator('[data-testid="@welcome-layout/body"]').waitFor({
        state: 'visible',
        timeout: 30000,
    });
    await mockRemoteMessageSystem(onboardingPage);

    const onboarding = new OnboardingPage(
        onboardingPage,
        device,
        new DevicePrompt(onboardingPage, model as any),
        new AnalyticsSection(onboardingPage),
        new SettingsPage(onboardingPage, device),
    );

    await onboarding.completeOnboarding();
    await onboardingPage.close();

    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
        try {
            serviceWorker = await context.waitForEvent('serviceworker', {
                timeout: 10_000,
            });
        } catch {
            throw new Error(
                `Connect Explorer webextension service worker not found. Service workers available: ${context.serviceWorkers().length}`,
            );
        }
    }

    if (!serviceWorker) {
        throw new Error('Connect Explorer webextension service worker not found');
    }

    const extensionId = serviceWorker.url().split('/')[2];
    const extensionUrl = `chrome-extension://${extensionId}/methods/bitcoin/getAddress/index.html?core-mode=suite-web`;

    const page = await context.newPage();
    await page.goto(extensionUrl, { waitUntil: 'domcontentloaded' });

    await page.getByTestId('@api-playground/collapsible-box').click();
    await expect(page.getByTestId('@submit-button')).toBeVisible();

    // Register the page listener before clicking to avoid a race where the
    // new tab opens before waitForEvent is attached.
    const [suite] = await Promise.all([
        context.waitForEvent('page', { timeout: 10_000 }),
        page.getByTestId('@submit-button').click(),
    ]);

    await suite.waitForLoadState('domcontentloaded', { timeout: 10_000 });
    await suite
        .getByTestId('@suite/menu/suite-index')
        .waitFor({ state: 'visible', timeout: 15_000 });

    const connectPermissionsModal = new ConnectPermissionsModal(suite);
    await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer', {
        timeout: 15_000,
    });
    if (!skipPermissionConfirm) {
        connectPermissionsModal.confirmButton.click();

        await expect(connectPermissionsModal.loadingHeader).toHaveText('Export Bitcoin address');
    }

    return { context, page, suite, connectPermissionsModal };
}

test.describe(
    'TrezorConnect webextension -> Suite Web',
    { tag: ['@smoke', '@T3T1', '@webOnly'] },
    () => {
        test(
            'TrezorConnect.getAddress',
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Suite Web Connect (webextension): Happy path scenario with getAddress',
                }),
            },
            async ({ model, device, context: defaultContext }) => {
                const { context, page, suite } = await setupWebextensionTest(
                    model,
                    device,
                    defaultContext,
                    'connect-explorer-webextension',
                );

                try {
                    await suite.getByTestId('@connect-address-confirmation/confirm-button').click();

                    await expect(
                        suite.getByTestId('@connect-address-confirmation/verify-button/0'),
                    ).toBeDisabled();
                    await suite.waitForTimeout(1000);
                    await device.pressYes();

                    await expect(
                        suite.getByTestId('@connect-address-confirmation/verified-badge/0'),
                    ).toBeVisible();

                    await suite.getByTestId('@connect-address-confirmation/close-button').click();

                    const response = page.getByTestId('@response');
                    await expect(response).toHaveText(/success: true/);
                } finally {
                    await context.close();
                }
            },
        );

        test(
            'call cancellation',
            {
                annotation: createTestAnnotation({
                    testCase: 'Suite Web Connect (webextension): Call cancelled by user',
                }),
            },
            async ({ model, device, context: defaultContext }) => {
                // --- Cancel on Grant Permissions modal ---
                const {
                    context,
                    page,
                    connectPermissionsModal: modal1,
                } = await setupWebextensionTest(
                    model,
                    device,
                    defaultContext,
                    'connect-explorer-webextension-cancellation',
                    { skipPermissionConfirm: true },
                );

                try {
                    await modal1.cancelButton.click();

                    const response1 = page.getByTestId('@response');
                    await expect(response1).toHaveText(/success: false/);

                    // --- Cancel after confirming permissions (on address confirmation) ---
                    const [suite2] = await Promise.all([
                        context.waitForEvent('page', { timeout: 10_000 }),
                        page.getByTestId('@submit-button').click(),
                    ]);

                    await suite2.waitForLoadState('domcontentloaded', { timeout: 10_000 });
                    await suite2
                        .getByTestId('@suite/menu/suite-index')
                        .waitFor({ state: 'visible', timeout: 15_000 });

                    const modal2 = new ConnectPermissionsModal(suite2);
                    await expect(modal2.appName).toHaveText('Trezor Connect Explorer', {
                        timeout: 15_000,
                    });
                    await modal2.confirmButton.click();

                    await expect(modal2.loadingHeader).toHaveText('Export Bitcoin address');
                    await suite2.getByTestId('@connect-address-confirmation/close-button').click();

                    const response2 = page.getByTestId('@response');
                    await expect(response2).toHaveText(/success: false/);
                } finally {
                    await context.close();
                }
            },
        );

        test(
            'call cancelled from calling application',
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Suite Web Connect (webextension): Call cancelled via TrezorConnect.cancel() from the calling app',
                }),
            },
            async ({ model, device, context: defaultContext }) => {
                const { context, page, suite } = await setupWebextensionTest(
                    model,
                    device,
                    defaultContext,
                    'connect-explorer-webextension-cancel-from-app',
                );

                try {
                    // Switch back to connect-explorer and click the cancel "x" button
                    // that appears next to the submit button while a call is in progress.
                    await page.bringToFront();
                    const cancelButton = page.getByTestId('@cancel-button');
                    await cancelButton.click();

                    const response = page.getByTestId('@response');
                    await expect(response).toHaveText(/success: false/);
                    await expect(response).toHaveText(/Method_Interrupted/);

                    // The popup (suite tab) should show a cancellation message.
                    await expect(suite.getByText('Request was canceled by the user')).toBeVisible({
                        timeout: 15_000,
                    });
                } finally {
                    await context.close();
                }
            },
        );

        test(
            'closing popup window',
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Suite Web Connect (webextension): Closing the popup window (not close button) returns a proper error',
                }),
            },
            async ({ model, device, context: defaultContext }) => {
                const { context, page, suite } = await setupWebextensionTest(
                    model,
                    device,
                    defaultContext,
                    'connect-explorer-webextension-interrupted',
                );

                try {
                    // Close the browser popup window directly (simulates user clicking X)
                    await suite.close();

                    const response = page.getByTestId('@response');
                    await expect(response).toHaveText(/success: false/);
                    await expect(response).toHaveText(/Method_Interrupted/);
                } finally {
                    await context.close();
                }
            },
        );

        test(
            'second call after popup was closed by user should work',
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Suite Web Connect (webextension): After popup is force-closed, next call should still work',
                }),
            },
            async ({ model, device, context: defaultContext }) => {
                const {
                    context,
                    page,
                    suite: suite1,
                } = await setupWebextensionTest(
                    model,
                    device,
                    defaultContext,
                    'connect-explorer-webextension-recovery',
                );

                try {
                    // Close the Suite popup directly (simulates user clicking X)
                    await suite1.close();

                    const response1 = page.getByTestId('@response');
                    await expect(response1).toHaveText(/success: false/);
                    await expect(response1).toHaveText(/Method_Interrupted/);

                    // Second call — register page listener before clicking to
                    // avoid a race where the tab opens before waitForEvent.
                    const [suite2] = await Promise.all([
                        context.waitForEvent('page', { timeout: 10_000 }),
                        page.getByTestId('@submit-button').click(),
                    ]);
                    await suite2.waitForLoadState('domcontentloaded', { timeout: 10_000 });
                    await suite2
                        .getByTestId('@suite/menu/suite-index')
                        .waitFor({ state: 'visible', timeout: 15_000 });

                    const modal2 = new ConnectPermissionsModal(suite2);
                    await expect(modal2.appName).toHaveText('Trezor Connect Explorer', {
                        timeout: 15_000,
                    });
                    await modal2.confirmButton.click();

                    await expect(modal2.loadingHeader).toHaveText('Export Bitcoin address');
                    await suite2
                        .getByTestId('@connect-address-confirmation/confirm-button')
                        .click();

                    await expect(
                        suite2.getByTestId('@connect-address-confirmation/verify-button/0'),
                    ).toBeDisabled();
                    await suite2.waitForTimeout(1000);
                    await device.pressYes();

                    await expect(
                        suite2.getByTestId('@connect-address-confirmation/verified-badge/0'),
                    ).toBeVisible();
                    await suite2.getByTestId('@connect-address-confirmation/close-button').click();
                    const response2 = page.getByTestId('@response');
                    await expect(response2).toHaveText(/success: true/);
                } finally {
                    await context.close();
                }
            },
        );

        test(
            'focuses existing popup if already open',
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Suite Web Connect (webextension): If popup is already open, it should be focused instead of opening a new one',
                }),
            },
            async ({ model, device, context: defaultContext }) => {
                const { context, page, suite } = await setupWebextensionTest(
                    model,
                    device,
                    defaultContext,
                    'connect-explorer-webextension-focus',
                );

                try {
                    // Start the address flow but don't finish it
                    await suite.getByTestId('@connect-address-confirmation/confirm-button').click();

                    await expect(
                        suite.getByTestId('@connect-address-confirmation/verify-button/0'),
                    ).toBeDisabled();
                    await suite.waitForTimeout(1000);
                    await device.pressYes();

                    await expect(
                        suite.getByTestId('@connect-address-confirmation/verified-badge/0'),
                    ).toBeVisible();

                    // Switch focus back to the extension and click submit again
                    await page.bringToFront();

                    // Count pages before second click
                    const pageCountBefore = context.pages().length;

                    await page.getByTestId('@submit-button').click();

                    // Wait a bit and verify no new page was opened
                    await page.waitForTimeout(2000);
                    const pageCountAfter = context.pages().length;

                    expect(pageCountAfter).toBe(pageCountBefore);

                    // The original Suite popup should still be open
                    expect(suite.isClosed()).toBe(false);

                    // Clean up
                    await suite.close();
                } finally {
                    await context.close();
                }
            },
        );
    },
);
