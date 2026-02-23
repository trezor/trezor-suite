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
    const branchMatch = baseUrl.match(/suite-web\/(.*?)\/web/);
    if (!branchMatch) {
        throw new Error('Could not extract branch from BASE_URL');
    }

    return getConnectExplorerUrlSldev(baseUrl.match(/suite-web\/(.*?)\/web/)?.[1]);
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
                page.waitForEvent('popup'),
                page.getByTestId('@submit-button').click(),
            ]);
            const connectPermissionsModal = new ConnectPermissionsModal(suite);
            await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 10_000,
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
            const [suite] = await Promise.all([
                page.waitForEvent('popup'),
                page.getByTestId('@submit-button').click(),
            ]);
            const connectPermissionsModal = new ConnectPermissionsModal(suite);
            await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 10_000,
            });
            await connectPermissionsModal.confirmButton.click();

            await expect(connectPermissionsModal.loadingHeader).toHaveText(
                'Export Bitcoin address',
            );
            await suite.getByTestId('@connect-address-confirmation/close-button').click();

            const response = page.getByTestId('@response');
            await expect(response).toHaveText(/success: false/);
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
                page.waitForEvent('popup'),
                page.getByTestId('@submit-button').click(),
            ]);
            const connectPermissionsModal = new ConnectPermissionsModal(suite);
            await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 10_000,
            });

            // Close the browser popup window directly (simulates user clicking X)
            await suite.close();

            const response = page.getByTestId('@response');
            await expect(response).toHaveText(/success: false/);
            // PopupManager.emitClosed() produces { code: 'Method_Interrupted', error: 'popup-closed' }
            // (the error value is the POPUP.CLOSED constant, not the human-readable ERROR_CODES string)
            await expect(response).toHaveText(/Method_Interrupted/);
            await expect(response).toHaveText(/popup-closed/);
        },
    );

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
                page.waitForEvent('popup'),
                page.getByTestId('@submit-button').click(),
            ]);
            const modal1 = new ConnectPermissionsModal(suite1);
            await expect(modal1.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 10_000,
            });
            await suite1.close();

            await expect(page.getByTestId('@response')).toHaveText(/success: false/);
            // PopupManager.emitClosed() produces { code: 'Method_Interrupted', error: 'popup-closed' }
            await expect(page.getByTestId('@response')).toHaveText(/Method_Interrupted/);
            await expect(page.getByTestId('@response')).toHaveText(/popup-closed/);

            // Second call — should open a new popup and complete successfully
            const [suite2] = await Promise.all([
                page.waitForEvent('popup'),
                page.getByTestId('@submit-button').click(),
            ]);
            const modal2 = new ConnectPermissionsModal(suite2);
            await expect(modal2.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 10_000,
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

    // ---------------------------------------------------------------------------
    // Edge-case and regression tests
    //
    // These document known behavioral issues and edge cases in PopupManager.
    // Skipped tests serve as a benchmark — enable them after the refactoring to
    // verify the fix.
    // ---------------------------------------------------------------------------

    test(
        'second call immediately after first completes works correctly',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Suite Web Connect: Sequential calls — second getAddress after first succeeds',
            }),
        },
        async ({ page, device }) => {
            // Known issue: after the first popup closes (via close-button), the
            // close-detection interval fires and emits a second POPUP.CLOSED,
            // which can corrupt state and prevent the next call from opening a
            // new popup. This test will pass once the double-emitClosed bug is
            // fixed.
            await gotoConnectExplorer(page, 'bitcoin/getAddress');

            // --- First call ---
            await page.getByTestId('@api-playground/collapsible-box').click();
            await expect(page.getByTestId('@submit-button')).toBeVisible();
            let [suite] = await Promise.all([
                page.waitForEvent('popup'),
                page.getByTestId('@submit-button').click(),
            ]);
            let connectPermissionsModal = new ConnectPermissionsModal(suite);
            await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer', {
                timeout: 10_000,
            });
            await expect(connectPermissionsModal.rememberCheckbox).toBeVisible();
            await connectPermissionsModal.rememberCheckbox.click();
            await connectPermissionsModal.confirmButton.click();
            await suite.getByTestId('@connect-address-confirmation/confirm-button').click();
            await suite.waitForTimeout(1000);
            await device.pressYes();
            await expect(
                suite.getByTestId('@connect-address-confirmation/verified-badge/0'),
            ).toBeVisible();
            await suite.getByTestId('@connect-address-confirmation/close-button').click();

            await expect(page.getByTestId('@response')).toHaveText(/success: true/);

            // --- Second call: popup should open and complete again ---
            // And it fails to open. If I put some timeout here, it works so this bug is unlikely to hit a regular user
            [suite] = await Promise.all([
                page.waitForEvent('popup'),
                page.getByTestId('@submit-button').click(),
            ]);

            // Permissions remembered from first call, so we skip straight to the action
            await suite.getByTestId('@connect-address-confirmation/confirm-button').click();
            await suite.waitForTimeout(1000);
            await device.pressYes();
            await expect(
                suite.getByTestId('@connect-address-confirmation/verified-badge/0'),
            ).toBeVisible();
            await suite.getByTestId('@connect-address-confirmation/close-button').click();

            await expect(page.getByTestId('@response')).toHaveText(/success: true/);
        },
    );
});
