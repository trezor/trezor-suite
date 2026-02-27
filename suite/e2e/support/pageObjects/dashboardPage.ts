import { Locator, Page, expect } from '@playwright/test';

import { NetworkSymbol } from '@suite-common/wallet-config';

import { step } from '../common';
import { DevicePrompt } from './devicePrompt';
import { DeviceFixture } from '../device';

export type graphRangeOptions = 'day' | 'week' | 'month' | 'year' | 'all';
export type PromoBannerType = 'tex' | 'ts7';

export class DashboardPage {
    readonly suiteLayout: Locator;
    readonly dashboardMenuButton: Locator;
    readonly dashboardHeader: Locator;
    readonly graph: Locator;
    readonly graphRangeSelector = (range: graphRangeOptions) =>
        this.page.getByTestId(`@dashboard/graph/range-${range}`);
    readonly deviceSwitchingOpenButton: Locator;
    readonly deviceSwitchingCloseButton: Locator;
    readonly modal: Locator;
    readonly deviceSwitcherModal: Locator;
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
    readonly addNewHiddenWalletButton: Locator;
    readonly addExistingHiddenWalletButton: Locator;
    readonly hideBalanceButton: Locator;
    readonly portfolioFiatAmount: Locator;
    readonly deviceStatus: Locator;
    readonly deviceStatusOnSwitchDevice: Locator;
    readonly solveIssuesButton: Locator;
    readonly passphraseDuplicateHeader: Locator;
    readonly passphraseDuplicateDesc: Locator;
    readonly passphraseMismatchHeader: Locator;
    readonly passphraseMismatchDesc: Locator;
    readonly passphraseInput: Locator;
    readonly passphraseSubmitButton: Locator;
    readonly passphraseShowButton: Locator;
    readonly passphraseMismatchStartOverButton: Locator;
    readonly openUnusedWalletButton1: Locator;
    readonly openUnusedWalletButton2: Locator;
    readonly loading: Locator;
    readonly notificationNoBackupButton: Locator;
    readonly buyButton = (networkSymbol: NetworkSymbol): Locator =>
        this.page.getByTestId(`@dashboard/asset/${networkSymbol}/buy-button`);
    readonly stakeButton = (networkSymbol: NetworkSymbol): Locator =>
        this.page.getByTestId(`@dashboard/asset/${networkSymbol}/stake-button`);
    readonly walletReady: Locator;
    readonly discoveryEmptyHeader: Locator;
    readonly discoveryEmptyDesc: Locator;
    readonly discoveryEmptyPrimaryButton: Locator;
    readonly promoBannerButton = (bannerTyp: PromoBannerType): Locator =>
        this.page.getByTestId(`@dashboard/promo-banner/${bannerTyp}/button`);

    constructor(
        private readonly page: Page,
        private readonly device: DeviceFixture,
        private readonly devicePrompt: DevicePrompt,
    ) {
        this.suiteLayout = this.page.getByTestId('@suite-layout/body');
        this.dashboardMenuButton = this.page.getByTestId('@suite/menu/suite-index');
        this.dashboardHeader = this.page.getByRole('heading', { name: 'Dashboard' });
        this.graph = this.page.getByTestId('@dashboard/graph');
        this.deviceSwitchingOpenButton = this.page.getByTestId('@menu/switch-device');
        this.deviceSwitchingCloseButton = this.page.getByTestId('@modal/backdrop').first();
        this.modal = this.page.modal;
        this.deviceSwitcherModal = this.page.getByTestId('@modal/switch-device');
        this.confirmDeviceEjectButton = this.page.getByTestId('@switch-device/eject');
        this.addStandardWalletButton = this.page.getByTestId('@switch-device/add-wallet-button');
        this.addHiddenWalletButton = this.page.getByTestId(
            '@switch-device/add-hidden-wallet-button',
        );
        this.addNewHiddenWalletButton = this.page.getByTestId(
            '@switch-device/add-new-hidden-wallet-button',
        );
        this.addExistingHiddenWalletButton = this.page.getByTestId(
            '@switch-device/add-existing-hidden-wallet-button',
        );
        this.hideBalanceButton = this.page.getByTestId('@quickActions/hideBalances');
        this.portfolioFiatAmount = this.page.getByTestId('@dashboard/portfolio/fiat-amount');
        this.deviceStatus = this.page.locator("[data-testid-alt='@deviceStatus']");
        this.deviceStatusOnSwitchDevice = this.page
            .getByTestId('@menu/switch-device')
            .locator("[data-testid-alt='@deviceStatus']");
        this.passphraseDuplicateHeader = this.page.getByTestId('@passphrase-duplicate-header');
        this.passphraseDuplicateDesc = this.page.getByTestId('@passphrase-duplicate-description');
        this.passphraseMismatchHeader = this.page.getByTestId('@passphrase-mismatch-header');
        this.passphraseMismatchDesc = this.page.getByTestId('@passphrase-mismatch-description');
        this.solveIssuesButton = this.page.getByTestId('@switch-device/solve-issue-button');
        this.passphraseInput = this.page.getByTestId('@passphrase/input');
        this.passphraseSubmitButton = this.page.getByTestId('@passphrase/hidden/submit-button');
        this.passphraseShowButton = this.page.getByTestId('@passphrase/show-toggle');
        this.passphraseMismatchStartOverButton = this.page.getByTestId(
            '@passphrase-mismatch/start-over',
        );
        this.openUnusedWalletButton1 = this.page.getByTestId(
            '@passphrase-confirmation/step1-open-unused-wallet-button',
        );
        this.openUnusedWalletButton2 = this.page.getByTestId(
            '@passphrase-confirmation/step2-button',
        );
        this.loading = this.page.getByTestId('@dashboard/loading');
        this.notificationNoBackupButton = this.page.getByTestId('@notification/no-backup/button');
        this.walletReady = this.page.getByTestId('@dashboard/wallet-ready');
        this.discoveryEmptyHeader = this.page.getByTestId('@exception/discovery-empty/header');
        this.discoveryEmptyDesc = this.page.getByTestId('@exception/discovery-empty/description');
        this.discoveryEmptyPrimaryButton = this.page.getByTestId(
            '@exception/discovery-empty/warning-button',
        );
    }

    @step()
    async navigateTo() {
        await this.dashboardMenuButton.click();
        await expect(this.dashboardHeader).toBeVisible();
    }

    @step()
    async openDeviceSwitcher() {
        await this.deviceSwitchingOpenButton.click();
        await expect(this.deviceSwitcherModal).toBeVisible();
    }

    @step()
    async ejectWallet(walletIndex: number = 0) {
        const ejectedWallet = await this.walletAtIndex(walletIndex).elementHandle();
        await this.walletAtIndex(walletIndex).hover();
        await this.walletAtIndexEjectButton(walletIndex).click();
        await this.confirmDeviceEjectButton.click();
        await ejectedWallet?.waitForElementState('hidden');
    }

    @step()
    async addStandardWallet() {
        await this.addStandardWalletButton.click();
        await this.modal.waitFor({ state: 'detached' });
        await this.page.discoveryShouldFinish();
    }

    @step()
    async addHiddenWallet(passphrase: string, options?: { skipDiscovery?: boolean }) {
        await this.addHiddenWalletButton.click();
        await this.addExistingHiddenWalletButton.click();

        await this.passphraseInput.fill(passphrase);
        await this.passphraseSubmitButton.click();
        await expect(this.passphraseInput).toBeHidden();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.pressYes();

        await this.devicePrompt.confirmOnDevicePromptIsShown();

        if (options?.skipDiscovery) {
            await this.device.pressYes();

            return;
        }

        // Sometimes the pressYes action takes 5,5s and suite in meantime can finish discovery
        // This would cause failure of the test even tho the flow continued correctly
        // Solution is to fire both Promises asynchronously and wait for both to finish
        await Promise.all([this.device.pressYes(), this.page.discoveryShouldFinish()]);
    }

    @step()
    async addUnusedHiddenWallet(
        passphrase: string,
        options?: { suiteSync?: 'enable' | 'decline' },
    ) {
        await this.addHiddenWalletButton.click();
        await this.addNewHiddenWalletButton.click();
        await this.openUnusedWalletButton2.click();
        await this.passphraseInput.fill(passphrase);
        await this.passphraseSubmitButton.click();
        await expect(this.passphraseInput).toBeHidden();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.pressYes();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.pressYes();

        await this.passphraseInput.fill(passphrase);
        await this.passphraseSubmitButton.click();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.pressYes();

        await this.devicePrompt.confirmOnDevicePromptIsShown();
        await this.device.pressYes();

        if (options?.suiteSync === 'enable') {
            await this.device.expectToContainOnDisplay('Sync');
            await this.devicePrompt.confirmOnDevicePromptIsShown();
            await this.device.pressYes();
            // wait before closing the modal to prevent "Trezor Sync key retrieval failed" error
            await this.page.waitForTimeout(2000);
        } else if (options?.suiteSync === 'decline') {
            await this.device.expectToContainOnDisplay('Sync');
            await this.devicePrompt.confirmOnDevicePromptIsShown();
            await this.device.pressNo();
        }

        await expect(
            this.devicePrompt.confirmOnDevicePrompt,
            'expected Device Prompt to be hidden. pressYes may failed.',
        ).toBeHidden();
    }

    @step()
    async openDevice(index: number) {
        await this.page.getByTestId(`@switch-device/wallet-on-index/${index}`).click();
    }
}
