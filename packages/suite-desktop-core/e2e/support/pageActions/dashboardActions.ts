import { Locator, Page, expect } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

export class DashboardActions {
    private readonly window: Page;
    readonly dashboardMenuButton: Locator;
    readonly discoveryHeader: Locator;
    readonly discoveryBar: Locator;
    readonly dashboardGraph: Locator;
    readonly deviceSwitchingOpenButton: Locator;
    readonly modal: Locator;
    readonly walletAtIndex = (index: number) =>
        this.window.getByTestId(`@switch-device/wallet-on-index/${index}`);
    readonly walletAtIndexEjectButton = (index: number) =>
        this.window.getByTestId(`@switch-device/wallet-on-index/${index}/eject-button`);
    readonly confirmDeviceEjectButton: Locator;
    readonly addStandardWalletButton: Locator;
    readonly balanceOfNetwork = (network: NetworkSymbol) =>
        this.window.getByTestId(`@wallet/coin-balance/value-${network}`);

    constructor(window: Page) {
        this.window = window;
        this.dashboardMenuButton = this.window.getByTestId('@suite/menu/suite-index');
        this.discoveryHeader = this.window.getByRole('heading', { name: 'Dashboard' });
        this.discoveryBar = this.window.getByTestId('@wallet/discovery-progress-bar');
        this.dashboardGraph = this.window.getByTestId('@dashboard/graph');
        this.deviceSwitchingOpenButton = this.window.getByTestId('@menu/switch-device');
        this.modal = this.window.getByTestId('@modal');
        this.confirmDeviceEjectButton = this.window.getByTestId('@switch-device/eject');
        this.addStandardWalletButton = this.window.getByTestId('@switch-device/add-wallet-button');
    }

    async navigateTo() {
        await this.dashboardMenuButton.click();
        await expect(this.discoveryHeader).toBeVisible();
    }

    async discoveryShouldFinish() {
        await this.discoveryBar.waitFor({ state: 'attached', timeout: 10_000 });
        await this.discoveryBar.waitFor({ state: 'detached', timeout: 120_000 });
        await expect(this.dashboardGraph).toBeVisible();
    }

    async openDeviceSwitcher() {
        await this.deviceSwitchingOpenButton.click();
        await expect(this.modal).toBeVisible();
    }

    async ejectWallet(walletIndex: number = 0) {
        await this.walletAtIndexEjectButton(walletIndex).click();
        await this.confirmDeviceEjectButton.click();
        await this.walletAtIndex(walletIndex).waitFor({ state: 'detached' });
    }

    async addStandardWallet() {
        await this.addStandardWalletButton.click();
        await this.modal.waitFor({ state: 'detached' });
        await this.discoveryShouldFinish();
    }
}
