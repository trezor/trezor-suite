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
    test.beforeEach(async ({ onboardingPage, context }) => {
        await onboardingPage.completeOnboarding();
        await context.grantPermissions(['storage-access']);
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
            await suite.close({ runBeforeUnload: true });

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
            await expect(page.getByTestId('@submit-button')).toBeVisible();

            // First call — close the popup window directly
            const [suite1] = await Promise.all([
                page.waitForEvent('popup', { timeout: 30_000 }),
                page.getByTestId('@submit-button').click(),
            ]);
            const modal1 = new ConnectPermissionsModal(suite1);
            await expect(modal1.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 20_000,
            });
            await suite1.close({ runBeforeUnload: true });

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
        'closes existing popup if already open',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Suite Web Connect: If popup is already open, it should be closed before opening a new one',
            }),
        },
        async ({ page, device }) => {
            await gotoConnectExplorer(page, 'bitcoin/getAddress');
            await page.getByTestId('@api-playground/collapsible-box').click();
            await expect(page.getByTestId('@submit-button')).toBeVisible();

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

            const [popup2] = await Promise.all([
                page.waitForEvent('popup', { timeout: 30_000 }),
                page.getByTestId('@submit-button').click(),
            ]);

            // Check that the original popup is closed.
            await expect.poll(() => popup1.isClosed(), { timeout: 5_000 }).toBe(true);
            expect(popup2.isClosed()).toBe(false);

            // Verify the new popup works correctly
            // const connectPermissionsModalNew = new ConnectPermissionsModal(popup2);
            // await expect(connectPermissionsModalNew.appName).toHaveText('Trezor Connect Explorer', {
            //     timeout: 20_000,
            // });

            // Clean up
            await popup2.close();
        },
    );
});

test.describe(
    'TrezorConnect popup web - no onboarding',
    { tag: ['@smoke', '@T3T1', '@webOnly'] },
    () => {
        test(
            'popup blocked by browser returns popup-blocked error',
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Suite Web Connect: When popup is blocked, returns popup-blocked error',
                }),
            },
            async ({ page }) => {
                // When window.open returns null (popup blocked), the error is
                // returned immediately as { success: false, error: "popup-blocked" }.

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
                await expect(response).toHaveText(/popup-blocked/i);
            },
        );
    },
);
