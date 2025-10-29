import { Page } from '@playwright/test';

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
    const match = baseUrl.match(/suite-web\/(.*?)\/web/);

    return getConnectExplorerUrlSldev(match?.[1]);
}

async function gotoConnectExplorer(page: Page, method: string) {
    const path = `methods/${method}/?core-mode=suite-web&trezor-connect-src=${encodeURIComponent('http://localhost:8088/')}`;
    try {
        await page.goto(`${getConnectExplorerUrl()}${path}`, { waitUntil: 'load' });
    } catch {
        // Fallback to develop branch
        await page.goto(`${getConnectExplorerUrlSldev()}${path}`, {
            waitUntil: 'load',
        });
    }
}

test.describe('TrezorConnect popup web', { tag: ['@group=connect', '@webOnly'] }, () => {
    test.beforeEach(async ({ analyticsSection, onboardingPage }) => {
        await analyticsSection.continueButton.click();
        await onboardingPage.disableNecessaryFirmwareChecks();
    });

    test(
        'TrezorConnect.getAddress',
        {
            annotation: createTestAnnotation({
                testCase: 'Suite Web Connect: Happy path scenario with getAddress',
            }),
        },
        async ({ page, trezorUserEnvLink }) => {
            await gotoConnectExplorer(page, 'bitcoin/getAddress');

            // expand method tester
            await page.getByTestId('@api-playground/collapsible-box').click();
            await expect(page.getByTestId('@submit-button')).toBeVisible();
            await page.getByTestId('@submit-button').click();

            // await popup opening
            const popup = await page.waitForEvent('popup');

            const connectPermissionsModal = new ConnectPermissionsModal(popup);
            await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer');
            connectPermissionsModal.confirmButton.click();

            await expect(connectPermissionsModal.loadingHeader).toHaveText(
                'Export Bitcoin address',
            );
            await popup.getByTestId('@connect-address-confirmation/confirm-button').click();

            await expect(
                popup.getByTestId('@connect-address-confirmation/verify-button/0'),
            ).toBeDisabled();
            await popup.waitForTimeout(1000);
            await trezorUserEnvLink.pressYes();

            await expect(
                popup.getByTestId('@connect-address-confirmation/verified-badge/0'),
            ).toBeVisible();

            await popup.getByTestId('@connect-address-confirmation/close-button').click();

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
            const popup = await page.waitForEvent('popup');

            const connectPermissionsModal = new ConnectPermissionsModal(popup);
            await expect(connectPermissionsModal.appName).toHaveText('Trezor Connect Explorer');
            connectPermissionsModal.confirmButton.click();

            await expect(connectPermissionsModal.loadingHeader).toHaveText(
                'Export Bitcoin address',
            );
            await popup.getByTestId('@connect-address-confirmation/close-button').click();

            const response = page.getByTestId('@response');
            await expect(response).toHaveText(/success: false/);
        },
    );
});
