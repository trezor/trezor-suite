import { Page, expect as playwrightExpect } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { waitForDataTestSelector } from '../common';

class DashboardActions {
    optionallyDismissFwHashCheckError(window: Page) {
        // dismiss the error modal only if it appears (handle it async in parallel, not necessary to block the rest of the flow)
        window
            .$('[data-testid="@device-compromised/back-button"]')
            .then(dismissFwHashCheckButton => dismissFwHashCheckButton?.click());
    }

    async passThroughInitialRun(window: Page) {
        await waitForDataTestSelector(window, '@welcome/title');
        this.optionallyDismissFwHashCheckError(window);
        await window.getByTestId('@analytics/continue-button').click();
        await window.getByTestId('@onboarding/exit-app-button').click();

        await window.getByTestId('@onboarding/viewOnly/skip').click();
        await window.getByTestId('@viewOnlyTooltip/gotIt').click();
    }

    async discoveryShouldFinish(window: Page) {
        const discoveryBarSelector = '@wallet/discovery-progress-bar';
        await waitForDataTestSelector(window, discoveryBarSelector, {
            state: 'attached',
            timeout: 10_000,
        });
        await waitForDataTestSelector(window, discoveryBarSelector, {
            state: 'detached',
            timeout: 120_000,
        });
        await waitForDataTestSelector(window, '@dashboard/graph', { timeout: 30000 });
    }

    async openDeviceSwitcher(window: Page) {
        await window.getByTestId('@menu/switch-device').click();
        const deviceSwitcherModal = window.getByTestId('@modal');
        await deviceSwitcherModal.waitFor({ state: 'visible' });
    }

    async ejectWallet(window: Page, walletIndex: number = 0) {
        const wallet = window.locator(
            `[data-testid="@switch-device/wallet-on-index/${walletIndex}"]`,
        );
        await window
            .locator('[data-testid="@switch-device/wallet-on-index/0/eject-button"]')
            .click();
        await window.locator('[data-testid="@switch-device/eject"]').click();
        await wallet.waitFor({ state: 'detached' });
    }

    async addStandardWallet(window: Page) {
        const addStandardWallet = window.getByTestId('@switch-device/add-wallet-button');
        await addStandardWallet.click();
        await window.getByTestId('@modal').waitFor({ state: 'detached' });
        await this.discoveryShouldFinish(window);
    }

    // asserts
    async assertHasVisibleBalanceOnFirstAccount(window: Page, network: NetworkSymbol) {
        const locator = window.getByTestId(`@wallet/coin-balance/value-${network}`).first();

        await playwrightExpect(locator).toBeVisible();
    }
}

export const onDashboardPage = new DashboardActions();
