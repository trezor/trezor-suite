import { Page, expect as playwrightExpect } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { waitForDataTestSelector } from '../common';

export class DashboardActions {
    private readonly window: Page;
    constructor(window: Page) {
        this.window = window;
    }
    optionallyDismissFwHashCheckError() {
        // dismiss the error modal only if it appears (handle it async in parallel, not necessary to block the rest of the flow)
        this.window
            .$('[data-testid="@device-compromised/back-button"]')
            .then(dismissFwHashCheckButton => dismissFwHashCheckButton?.click());
    }

    async passThroughInitialRun() {
        await waitForDataTestSelector(this.window, '@welcome/title');
        this.optionallyDismissFwHashCheckError();
        await this.window.getByTestId('@analytics/continue-button').click();
        await this.window.getByTestId('@onboarding/exit-app-button').click();

        await this.window.getByTestId('@onboarding/viewOnly/skip').click();
        await this.window.getByTestId('@viewOnlyTooltip/gotIt').click();
    }

    async discoveryShouldFinish() {
        const discoveryBarSelector = '@wallet/discovery-progress-bar';
        await waitForDataTestSelector(this.window, discoveryBarSelector, {
            state: 'attached',
            timeout: 10_000,
        });
        await waitForDataTestSelector(this.window, discoveryBarSelector, {
            state: 'detached',
            timeout: 120_000,
        });
        await waitForDataTestSelector(this.window, '@dashboard/graph', { timeout: 30000 });
    }

    async openDeviceSwitcher() {
        await this.window.getByTestId('@menu/switch-device').click();
        const deviceSwitcherModal = this.window.getByTestId('@modal');
        await deviceSwitcherModal.waitFor({ state: 'visible' });
    }

    async ejectWallet(walletIndex: number = 0) {
        const wallet = this.window.locator(
            `[data-testid="@switch-device/wallet-on-index/${walletIndex}"]`,
        );
        await this.window
            .locator('[data-testid="@switch-device/wallet-on-index/0/eject-button"]')
            .click();
        await this.window.locator('[data-testid="@switch-device/eject"]').click();
        await wallet.waitFor({ state: 'detached' });
    }

    async addStandardWallet() {
        const addStandardWallet = this.window.getByTestId('@switch-device/add-wallet-button');
        await addStandardWallet.click();
        await this.window.getByTestId('@modal').waitFor({ state: 'detached' });
        await this.discoveryShouldFinish();
    }

    // asserts
    async assertHasVisibleBalanceOnFirstAccount(network: NetworkSymbol) {
        const locator = this.window.getByTestId(`@wallet/coin-balance/value-${network}`).first();

        await playwrightExpect(locator).toBeVisible();
    }
}
