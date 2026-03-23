import { type Page } from '@playwright/test';

import { createTestAnnotation } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { ConnectPermissionsModal } from '../../support/pageObjects/connectPermissionsModal';

function getConnectExplorerUrlSldev(branch: string = 'develop') {
    return `https://dev.suite.sldev.cz/connect/${branch}/`;
}

function getConnectExplorerUrl() {
    const baseUrl = process.env.BASE_URL;
    if (!baseUrl) {
        return 'http://localhost:8088/';
    }
    const branchMatch = baseUrl.match(/suite-web\/(.*?)\/web\/$/);
    if (!branchMatch) {
        throw new Error('Could not extract branch from BASE_URL');
    }

    return getConnectExplorerUrlSldev(branchMatch[1]);
}

async function gotoConnectExplorer(page: Page, method: string) {
    const url = `methods/${method}/?core-mode=suite-web`;
    try {
        await page.goto(`${getConnectExplorerUrl()}${url}`, { waitUntil: 'load' });
    } catch {
        // Fallback to develop branch
        await page.goto(`${getConnectExplorerUrlSldev()}${url}`, {
            waitUntil: 'load',
        });
    }
}

test.describe('TrezorConnect popup web', { tag: ['@smoke', '@T3T1', '@webOnly'] }, () => {
    test.beforeEach(async ({ onboardingPage }) => {
        await onboardingPage.completeOnboarding();
    });
    test(
        'TrezorConnect.getAddress',
        {
            annotation: createTestAnnotation({
                testCase: 'Suite Web Connect: Happy path scenario with getAddress',
            }),
        },
        async ({ page, device }) => {
            await gotoConnectExplorer(page, 'bitcoin/getAddress');

            // expand method tester
            await page.getByTestId('@api-playground/collapsible-box').click();
            await expect(page.getByTestId('@submit-button')).toBeVisible();
            const [suite] = await Promise.all([
                page.waitForEvent('popup', { timeout: 30_000 }),
                page.getByTestId('@submit-button').click(),
            ]);

            const connectPermissionsModal = new ConnectPermissionsModal(suite);
            await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 20_000,
            });
            await connectPermissionsModal.confirmButton.click();

            await expect(connectPermissionsModal.loadingHeader).toHaveText(
                'Export Bitcoin address',
            );
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
        },
    );

    test(
        'call cancellation',
        {
            annotation: createTestAnnotation({
                testCase: 'Suite Web Connect: Call cancelled by user',
            }),
        },
        async ({ page }) => {
            await gotoConnectExplorer(page, 'bitcoin/getAddress');

            // expand method tester
            await page.getByTestId('@api-playground/collapsible-box').click();
            await expect(page.getByTestId('@submit-button')).toBeVisible();

            // --- Cancel on Grant Permissions modal ---
            const [suite1] = await Promise.all([
                page.waitForEvent('popup', { timeout: 30_000 }),
                page.getByTestId('@submit-button').click(),
            ]);
            const modal1 = new ConnectPermissionsModal(suite1);
            await expect(modal1.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 20_000,
            });
            await modal1.cancelButton.click();

            const response1 = page.getByTestId('@response');
            await expect(response1).toHaveText(/success: false/);

            // --- Cancel after confirming permissions (on address confirmation) ---
            const [suite2] = await Promise.all([
                page.waitForEvent('popup', { timeout: 30_000 }),
                page.getByTestId('@submit-button').click(),
            ]);
            const modal2 = new ConnectPermissionsModal(suite2);
            await expect(modal2.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 15_000,
            });
            await modal2.confirmButton.click();

            await expect(modal2.loadingHeader).toHaveText('Export Bitcoin address');
            await suite2.getByTestId('@connect-address-confirmation/close-button').click();

            const response2 = page.getByTestId('@response');
            await expect(response2).toHaveText(/success: false/);
        },
    );

    test(
        'call cancelled from calling application',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Suite Web Connect: Call cancelled via TrezorConnect.cancel() from the calling app',
            }),
        },
        async ({ page }) => {
            await gotoConnectExplorer(page, 'bitcoin/getAddress');

            // expand method tester
            await page.getByTestId('@api-playground/collapsible-box').click();
            await expect(page.getByTestId('@submit-button')).toBeVisible();
            const [suite] = await Promise.all([
                page.waitForEvent('popup', { timeout: 30_000 }),
                page.getByTestId('@submit-button').click(),
            ]);
            const connectPermissionsModal = new ConnectPermissionsModal(suite);
            await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 20_000,
            });
            await connectPermissionsModal.confirmButton.click();

            await expect(connectPermissionsModal.loadingHeader).toHaveText(
                'Export Bitcoin address',
            );

            // Switch back to connect-explorer and click the cancel "x" button
            // that appears next to the submit button while a call is in progress.
            await page.bringToFront();
            const cancelButton = page.getByTestId('@cancel-button');
            await cancelButton.click();

            const response = page.getByTestId('@response');
            await expect(response).toHaveText(/success: false/);
            await expect(response).toHaveText(/Method_Interrupted/);

            // The popup (suite window) should show a cancellation message.
            await expect(suite.getByText('Request was canceled by the user')).toBeVisible({
                timeout: 15_000,
            });
        },
    );

    test(
        'closing popup window returns Method_Interrupted error',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Suite Web Connect: Closing the popup window (not close button) returns a proper error',
            }),
        },
        async ({ page }) => {
            await gotoConnectExplorer(page, 'bitcoin/getAddress');

            // expand method tester
            await page.getByTestId('@api-playground/collapsible-box').click();
            await expect(page.getByTestId('@submit-button')).toBeVisible();
            const [suite] = await Promise.all([
                page.waitForEvent('popup', { timeout: 30_000 }),
                page.getByTestId('@submit-button').click(),
            ]);
            const connectPermissionsModal = new ConnectPermissionsModal(suite);
            await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 20_000,
            });

            // Close the browser popup window directly (simulates user clicking X)
            await suite.close();

            const response = page.getByTestId('@response');
            await expect(response).toHaveText(/success: false/);
            await expect(response).toHaveText(/Method_Interrupted/);
        },
    );

    test(
        'second call after popup was closed by user should work',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Suite Web Connect: After popup is force-closed, next call should still work',
            }),
        },
        async ({ page, device }) => {
            // After the user closes the popup window directly (not via close button),
            // the closeInterval detects the dead window and cleans up state.
            // The next call should open a fresh popup and succeed.

            await gotoConnectExplorer(page, 'bitcoin/getAddress');
            await page.getByTestId('@api-playground/collapsible-box').click();

            // First call — close the popup window directly
            const [suite1] = await Promise.all([
                page.waitForEvent('popup', { timeout: 30_000 }),
                page.getByTestId('@submit-button').click(),
            ]);
            const modal1 = new ConnectPermissionsModal(suite1);
            await expect(modal1.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 20_000,
            });
            await suite1.close();

            await expect(page.getByTestId('@response')).toHaveText(/success: false/);
            await expect(page.getByTestId('@response')).toHaveText(/Method_Interrupted/);

            // Second call — should open a new popup and complete successfully
            const [suite2] = await Promise.all([
                page.waitForEvent('popup', { timeout: 30_000 }),
                page.getByTestId('@submit-button').click(),
            ]);
            const modal2 = new ConnectPermissionsModal(suite2);
            await expect(modal2.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 20_000,
            });
            await modal2.confirmButton.click();
            await suite2.getByTestId('@connect-address-confirmation/confirm-button').click();
            await suite2.waitForTimeout(1000);
            await device.pressYes();
            await expect(
                suite2.getByTestId('@connect-address-confirmation/verified-badge/0'),
            ).toBeVisible();
            await suite2.getByTestId('@connect-address-confirmation/close-button').click();

            await expect(page.getByTestId('@response')).toHaveText(/success: true/);
        },
    );

    test(
        'focuses existing popup if already open',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Suite Web Connect: If popup is already open, it should be focused instead of opening a new one',
            }),
        },
        async ({ page, device }) => {
            await gotoConnectExplorer(page, 'bitcoin/getAddress');
            await page.getByTestId('@api-playground/collapsible-box').click();

            // Open the popup for the first call, but do not close it
            const [popup1] = await Promise.all([
                page.waitForEvent('popup', { timeout: 30_000 }),
                page.getByTestId('@submit-button').click(),
            ]);

            // click until message is sent back so that submit button becomes active again
            const connectPermissionsModal = new ConnectPermissionsModal(popup1);
            await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 20_000,
            });
            await connectPermissionsModal.confirmButton.click();

            await expect(connectPermissionsModal.loadingHeader).toHaveText(
                'Export Bitcoin address',
            );
            await popup1.getByTestId('@connect-address-confirmation/confirm-button').click();

            await expect(
                popup1.getByTestId('@connect-address-confirmation/verify-button/0'),
            ).toBeDisabled();
            await device.pressYes();

            // focus connect-explorer again
            await page.bringToFront();

            // Initiate a second call while the popup is still open
            // Listen for new popup events
            let newPopupOpened = false;
            page.once('popup', () => {
                newPopupOpened = true;
            });
            await page.getByTestId('@submit-button').click();

            // Wait a short time to see if a new popup is opened
            await page.waitForTimeout(1000);

            // Assert that no new popup was opened
            expect(newPopupOpened).toBe(false);

            // Optionally, check that the original popup is still open
            expect(await popup1.isClosed()).toBe(false);

            // Clean up
            await popup1.close();
        },
    );
});

test.describe(
    'TrezorConnect popup web - no onboarding',
    { tag: ['@smoke', '@T3T1', '@webOnly'] },
    () => {
        test(
            'popup blocked by browser returns handshake failed error',
            {
                // note: we may use this test (after small changes) to test missing browser permissions
                // as proposed in https://github.com/trezor/trezor-suite/pull/23468
                annotation: createTestAnnotation({
                    testCase:
                        'Suite Web Connect: When popup is blocked, returns handshake failed error',
                }),
            },
            async ({ page }) => {
                // When window.open returns null (popup blocked), the handshake
                // times out and returns { success: false, error: "handshake failed" }.
                // Note: PopupManager still leaves `locked = true` after this, which
                // means subsequent calls will try to focus a non-existent window.

                await gotoConnectExplorer(page, 'bitcoin/getAddress');
                await page.getByTestId('@api-playground/collapsible-box').click();

                // Block popups
                await page.evaluate(() => {
                    window.open = () => null;
                });

                await page.getByTestId('@submit-button').click();
                const response = page.getByTestId('@response');
                // todo: there is quite big  timeout before handshake failed appears. Maybe we could detect that popup
                // did not open earlier and return error faster?
                await expect(response).toHaveText(/success: false/, { timeout: 15_000 });
                await expect(response).toHaveText(/handshake failed/i);
            },
        );
    },
);
