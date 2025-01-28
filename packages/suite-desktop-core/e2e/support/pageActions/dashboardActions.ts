import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { step } from '../common';
import { DevicePromptActions } from './devicePromptActions';

export type graphRangeOptions = 'day' | 'week' | 'month' | 'year' | 'all';

export class DashboardActions {
    readonly dashboardMenuButton: Locator;
    readonly discoveryHeader: Locator;
    readonly discoveryBar: Locator;
    readonly graph: Locator;
    readonly graphRangeSelector = (range: graphRangeOptions) =>
        this.page.getByTestId(`@dashboard/graph/range-${range}`);
    readonly deviceSwitchingOpenButton: Locator;
    readonly deviceSwitchingCloseButton: Locator;
    readonly modal: Locator;
    //TODO: Refactor to wallet page object
    readonly walletAtIndex = (index: number) =>
        this.page.getByTestId(`@switch-device/wallet-on-index/${index}`);
    readonly walletAtIndexEjectButton = (index: number) =>
        this.page.getByTestId(`@switch-device/wallet-on-index/${index}/eject-button`);
    readonly walletAtIndexFiatAmount = (index: number) =>
        this.page.getByTestId(`@switch-device/wallet-on-index/${index}/fiat-amount`);
    readonly confirmDeviceEjectButton: Locator;
    readonly addStandardWalletButton: Locator;
    readonly hideBalanceButton: Locator;
    readonly portfolioFiatAmount: Locator;
    readonly deviceStatus: Locator;
    readonly deviceStatusOnSwitchDevice: Locator;
    readonly solveIssuesButton: Locator;

    constructor(
        private readonly page: Page,
        private readonly devicePrompt: DevicePromptActions,
    ) {
        this.dashboardMenuButton = this.page.getByTestId('@suite/menu/suite-index');
        this.discoveryHeader = this.page.getByRole('heading', { name: 'Dashboard' });
        this.discoveryBar = this.page.getByTestId('@wallet/discovery-progress-bar');
        this.graph = this.page.getByTestId('@dashboard/graph');
        this.deviceSwitchingOpenButton = this.page.getByTestId('@menu/switch-device');
        this.deviceSwitchingCloseButton = this.page.getByTestId('@switch-device/cancel-button');
        this.modal = this.page.getByTestId('@modal');
        this.confirmDeviceEjectButton = this.page.getByTestId('@switch-device/eject');
        this.addStandardWalletButton = this.page.getByTestId('@switch-device/add-wallet-button');
        this.hideBalanceButton = this.page.getByTestId('@quickActions/hideBalances');
        this.portfolioFiatAmount = this.page.getByTestId('@dashboard/portfolio/fiat-amount');
        this.deviceStatus = this.page.locator("[data-testid-alt='@deviceStatus']");
        this.deviceStatusOnSwitchDevice = this.page
            .getByTestId('@menu/switch-device')
            .locator("[data-testid-alt='@deviceStatus']");
        this.solveIssuesButton = this.page.getByTestId('@switch-device/solve-issue-button');
    }

    @step()
    async navigateTo() {
        await this.dashboardMenuButton.click();
        await expect(this.discoveryHeader).toBeVisible();
    }

    @step()
    async discoveryShouldFinish() {
        await expect(this.discoveryBar, 'discovery bar should be visible').toBeVisible({
            timeout: 10_000,
        });
        await this.discoveryBar.waitFor({ state: 'detached', timeout: 120_000 });
    }

    @step()
    async openDeviceSwitcher() {
        await this.deviceSwitchingOpenButton.click();
        await expect(this.modal).toBeVisible();
    }

    @step()
    async ejectWallet(walletIndex: number = 0) {
        await this.walletAtIndexEjectButton(walletIndex).click();
        await this.confirmDeviceEjectButton.click();
        await this.walletAtIndex(walletIndex).waitFor({ state: 'detached' });
    }

    @step()
    async addStandardWallet() {
        await this.addStandardWalletButton.click();
        await this.modal.waitFor({ state: 'detached' });
        await this.discoveryShouldFinish();
    }

    @step()
    async addHiddenWallet(passphrase: string) {
        await this.page.getByTestId('@switch-device/add-hidden-wallet-button').click();
        await this.page.getByTestId('@passphrase/input').fill(passphrase);
        await this.page.getByTestId('@passphrase/hidden/submit-button').click();
        await expect(this.page.getByTestId('@passphrase/input')).not.toBeVisible();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLink.pressYes();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLink.pressYes();

        await this.page
            .getByTestId('@passphrase-confirmation/step1-open-unused-wallet-button')
            .click();
        await this.page.getByTestId('@passphrase-confirmation/step2-button').click();
        await this.page.getByTestId('@passphrase/input').fill(passphrase);
        await this.page.getByTestId('@passphrase/hidden/submit-button').click();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLink.pressYes();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLink.pressYes();

        await this.modal.waitFor({ state: 'detached' });
    }

    @step()
    async setViewOnlyForWallet(walletIndex: number, desiredState: 'enabled' | 'disabled') {
        const walletContainer = this.page.getByTestId(
            `@switch-device/wallet-on-index/${walletIndex}`,
        );
        const viewOnlyStatus = await walletContainer
            .getByTestId(`@viewOnlyStatus/${desiredState}`)
            .isVisible();

        // check if change is even necessary
        if (viewOnlyStatus) {
            return;
        }

        // if it is, open view-only settings container and change the state
        await walletContainer.getByTestId('@collapsible-box/icon-collapsed').click();
        await walletContainer.getByTestId('@collapsible-box/body').waitFor({ state: 'visible' });
        await walletContainer.getByTestId(`@collapsible-box/body`).getByText(desiredState).click();
        // close it to match the initial state
        await walletContainer.getByTestId('@collapsible-box/icon-expanded').click();
    }

    @step()
    async openDevice(index: number) {
        await this.page.getByTestId(`@switch-device/wallet-on-index/${index}`).click();
    }
}
