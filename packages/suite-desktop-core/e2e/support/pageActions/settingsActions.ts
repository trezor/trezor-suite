import { Page } from '@playwright/test';

import { BackendType, NetworkSymbol } from '@suite-common/wallet-config';

import { waitForDataTestSelector } from '../common';

const settingSectionsLocators = {
    debug: '@settings/debug/github',
    general: '@general-settings/language',
    device: '@settings/device/backup-recovery-seed',
    wallet: '@settings/wallet/network/btc',
} as const;
type Section = keyof typeof settingSectionsLocators;

export class SettingsActions {
    private readonly window: Page;
    constructor(window: Page) {
        this.window = window;
    }

    async toggleDebugModeInSettings() {
        const settingsHeader = this.window.getByTestId('@settings/menu/title');
        await settingsHeader.waitFor({ state: 'visible', timeout: 10_000 });
        const timesClickToSetDebugMode = 5;
        for (let i = 0; i < timesClickToSetDebugMode; i++) {
            await settingsHeader.click();
        }
        await this.window.getByTestId('@settings/menu/debug').waitFor({ state: 'visible' });
    }

    async goToSettingSection(section: Section) {
        await this.window.getByTestId(`@settings/menu/${section}`).click();
        //TODO: #15552 Refactor navigation verification to specific tests and remove this method completely
        await this.window
            .getByTestId(settingSectionsLocators[section])
            .waitFor({ state: 'visible', timeout: 10_000 });
    }

    async openNetworkSettings(desiredNetwork: NetworkSymbol) {
        await this.window.getByTestId(`@settings/wallet/network/${desiredNetwork}`).click();
        const networkSettingsButton = this.window.getByTestId(
            `@settings/wallet/network/${desiredNetwork}/advance`,
        );
        await networkSettingsButton.waitFor({ state: 'visible' });
        await networkSettingsButton.click();
        await waitForDataTestSelector(this.window, '@modal');
    }

    async enableCoin(desiredNetwork: NetworkSymbol) {
        await this.window.getByTestId(`@settings/wallet/network/${desiredNetwork}`).click();
    }

    async changeNetworkBackend(desiredNetworkBackend: BackendType, backendUrl: string) {
        const networkBackendSelector = this.window.getByTestId(
            '@settings/advance/select-type/input',
        );
        await networkBackendSelector.waitFor({ state: 'visible' });
        await networkBackendSelector.click();
        await this.window.getByTestId(`@settings/advance/${desiredNetworkBackend}`).click();
        const electrumAddressInput = this.window.getByTestId('@settings/advance/url');
        await electrumAddressInput.fill(backendUrl);
        await this.window.getByTestId('@settings/advance/button/save').click();
    }

    async joinEarlyAccessProgram() {
        await this.window
            .getByTestId('@settings/early-access-join-button')
            .scrollIntoViewIfNeeded();
        await this.window.getByTestId('@settings/early-access-join-button').click();
        const eapModal = this.window.getByTestId('@modal');
        await eapModal.waitFor({ state: 'visible' });
        await eapModal.getByTestId('@settings/early-access-confirm-check').click();
        await eapModal.getByTestId('@settings/early-access-confirm-button').click();
        await eapModal.getByTestId('@settings/early-access-skip-button').click();
    }

    async getEarlyAccessButtonText() {
        return await this.window.getByTestId('@settings/early-access-join-button').textContent();
    }

    async closeSettings() {
        await this.window.getByTestId('@settings/menu/close').click();
        await this.window.getByTestId('@settings/menu/title').waitFor({ state: 'detached' });
    }
}
