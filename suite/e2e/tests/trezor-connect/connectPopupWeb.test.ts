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
            await page.getByTestId('@submit-button').click();
            // await popup opening
            const suite = await page.waitForEvent('popup');
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
            await page.getByTestId('@submit-button').click();

            // await popup opening
            const suite = await page.waitForEvent('popup');

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
});
