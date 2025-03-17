import { Locator, Page, expect } from '@playwright/test';

import { TrezorUserEnvLinkProxy, step } from '../common';
import { DevicePrompt } from './devicePrompt';

export type graphRangeOptions = 'day' | 'week' | 'month' | 'year' | 'all';

export class DashboardPage {
    readonly dashboardMenuButton: Locator;
    readonly dashboardHeader: Locator;
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
    readonly addHiddenWalletButton: Locator;
    readonly hideBalanceButton: Locator;
    readonly portfolioFiatAmount: Locator;
    readonly deviceStatus: Locator;
    readonly deviceStatusOnSwitchDevice: Locator;
    readonly solveIssuesButton: Locator;
    readonly passphraseInput: Locator;
    readonly passphraseSubmitButton: Locator;
    readonly passphraseShowButton: Locator;
    readonly loading: Locator;
    readonly notificationNoBackupButton: Locator;
    readonly notificationFailedBackup: Locator;
    readonly openUnusedWalletButton1: Locator;
    readonly openUnusedWalletButton2: Locator;

    constructor(
        private readonly page: Page,
        private readonly devicePrompt: DevicePrompt,
    ) {
        this.dashboardMenuButton = this.page.getByTestId('@suite/menu/suite-index');
        this.dashboardHeader = this.page.getByRole('heading', { name: 'Dashboard' });
        this.discoveryBar = this.page.getByTestId('@wallet/discovery-progress-bar');
        this.graph = this.page.getByTestId('@dashboard/graph');
        this.deviceSwitchingOpenButton = this.page.getByTestId('@menu/switch-device');
        this.deviceSwitchingCloseButton = this.page.getByTestId('@switch-device/cancel-button');
        this.modal = this.page.getByTestId('@modal');
        this.confirmDeviceEjectButton = this.page.getByTestId('@switch-device/eject');
        this.addStandardWalletButton = this.page.getByTestId('@switch-device/add-wallet-button');
        this.addHiddenWalletButton = this.page.getByTestId(
            '@switch-device/add-hidden-wallet-button',
        );
        this.hideBalanceButton = this.page.getByTestId('@quickActions/hideBalances');
        this.portfolioFiatAmount = this.page.getByTestId('@dashboard/portfolio/fiat-amount');
        this.deviceStatus = this.page.locator("[data-testid-alt='@deviceStatus']");
        this.deviceStatusOnSwitchDevice = this.page
            .getByTestId('@menu/switch-device')
            .locator("[data-testid-alt='@deviceStatus']");
        this.solveIssuesButton = this.page.getByTestId('@switch-device/solve-issue-button');
        this.passphraseInput = this.page.getByTestId('@passphrase/input');
        this.passphraseSubmitButton = this.page.getByTestId('@passphrase/hidden/submit-button');
        this.passphraseShowButton = this.page.getByTestId('@passphrase/show-toggle');
        this.loading = this.page.getByTestId('@dashboard/loading');
        this.notificationNoBackupButton = this.page.getByTestId('@notification/no-backup/button');
        this.notificationFailedBackup = this.page.getByTestId('@notification/failed-backup/cta');
        this.openUnusedWalletButton1 = this.page.getByTestId(
            '@passphrase-confirmation/step1-open-unused-wallet-button',
        );
        this.openUnusedWalletButton2 = this.page.getByTestId(
            '@passphrase-confirmation/step2-button',
        );
    }

    @step()
    async navigateTo() {
        await this.dashboardMenuButton.click();
        await expect(this.dashboardHeader).toBeVisible();
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
        const ejectedWallet = await this.walletAtIndex(walletIndex).elementHandle();
        await this.walletAtIndexEjectButton(walletIndex).click();
        await this.confirmDeviceEjectButton.click();
        await ejectedWallet?.waitForElementState('hidden');
    }

    @step()
    async addStandardWallet() {
        await this.addStandardWalletButton.click();
        await this.modal.waitFor({ state: 'detached' });
        await this.discoveryShouldFinish();
    }

    @step()
    async addHiddenWallet(passphrase: string, options?: { skipDiscovery?: boolean }) {
        await this.addHiddenWalletButton.click();
        await this.passphraseInput.fill(passphrase);
        await this.passphraseSubmitButton.click();
        await expect(this.passphraseInput).not.toBeVisible();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLinkProxy.pressYes();

        await this.devicePrompt.confirmOnDevicePromptIsShown();

        if (options?.skipDiscovery) {
            await TrezorUserEnvLinkProxy.pressYes();

            return;
        }

        // Sometimes the pressYes action takes 5,5s and suite in meantime can finish discovery
        // This would cause failure of the test even tho the flow continued correctly
        // Solution is to fire both Promises asynchronously and wait for both to finish
        await Promise.all([TrezorUserEnvLinkProxy.pressYes(), this.discoveryShouldFinish()]);
    }

    @step()
    async addUnusedHiddenWallet(passphrase: string) {
        await this.addHiddenWallet(passphrase);
        await expect(
            this.openUnusedWalletButton1,
            'Expected "Yes, open" button to be enabled. Unused wallet might not finished Discovery.',
        ).toBeEnabled({ timeout: 30_000 });
        await this.openUnusedWalletButton1.click();
        await this.openUnusedWalletButton2.click();
        await this.passphraseInput.fill(passphrase);
        await this.passphraseSubmitButton.click();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLinkProxy.pressYes();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await TrezorUserEnvLinkProxy.pressYes();

        await expect(
            this.modal,
            'expected Device Prompt to be hidden. pressYes may failed.',
        ).toBeHidden();
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
