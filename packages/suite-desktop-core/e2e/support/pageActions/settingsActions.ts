import { Page } from '@playwright/test';
import { BackendType, NetworkSymbol } from 'suite-common/wallet-config/src';

import { waitForDataTestSelector } from '../common';

class SettingsActions {
    async toggleDebugModeInSettings(window: Page) {
        const settingsHeader = window.getByTestId('@settings/menu/title');
        await settingsHeader.waitFor({ state: 'visible', timeout: 10_000 });
        const timesClickToSetDebugMode = 5;
        for (let i = 0; i < timesClickToSetDebugMode; i++) {
            await settingsHeader.click();
        }
        await window.getByTestId('@settings/menu/debug').waitFor({ state: 'visible' });
    }

    async goToDesiredSettingsPlace(
        window: Page,
        desiredLocation: 'debug' | 'general' | 'device' | 'wallet',
    ) {
        let desiredLocationTestid: string;
        switch (desiredLocation) {
            case 'debug':
                desiredLocationTestid = '@settings/debug/github';
                break;
            case 'general':
                desiredLocationTestid = '@settings/language';
                break;
            case 'device':
                desiredLocationTestid = '@settings/device/backup-recovery-seed';
                break;
            // TODO: later add coverage for edge cases. Test now assumes active btc network
            case 'wallet':
                desiredLocationTestid = '@settings/wallet/network/btc';
                break;
            default:
                throw new Error('Unknown location, check your selector.');
        }
        await window.getByTestId(`@settings/menu/${desiredLocation}`).click();
        await window
            .getByTestId(desiredLocationTestid)
            .waitFor({ state: 'visible', timeout: 10_000 });
    }

    async openNetworkSettings(window: Page, desiredNetwork: NetworkSymbol) {
        await window.getByTestId(`@settings/wallet/network/${desiredNetwork}`).click();
        const networkSettingsButton = window.getByTestId(
            `@settings/wallet/network/${desiredNetwork}/advance`,
        );
        await networkSettingsButton.waitFor({ state: 'visible' });
        await networkSettingsButton.click();
        await waitForDataTestSelector(window, '@modal');
    }

    async enableCoin(window: Page, desiredNetwork: NetworkSymbol) {
        await window.getByTestId(`@settings/wallet/network/${desiredNetwork}`).click();
    }

    async changeNetworkBackend(
        window: Page,
        desiredNetworkBackend: BackendType,
        backendUrl: string,
    ) {
        const networkBackendSelector = await window.getByTestId(
            '@settings/advance/select-type/input',
        );
        await networkBackendSelector.waitFor({ state: 'visible' });
        await networkBackendSelector.click();
        await window.getByTestId(`@settings/advance/${desiredNetworkBackend}`).click();
        const electrumAddressInput = await window.getByTestId('@settings/advance/url');
        await electrumAddressInput.fill(backendUrl);
        await window.getByTestId('@settings/advance/button/save').click();
    }

    async closeSettings(window: Page) {
        await window.getByTestId('@settings/menu/close').click();
        await window.getByTestId('@settings/menu/title').waitFor({ state: 'detached' });
    }
}

export const onSettingsPage = new SettingsActions();
