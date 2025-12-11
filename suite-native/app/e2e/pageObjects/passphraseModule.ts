import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onDeviceManager } from './deviceManagerActions';
import { getModelFromEnv, waitForVisible } from '../support/utils';

class PassphraseModule {
    public async openNewPassphraseFlow() {
        await onDeviceManager.tapDeviceSwitch();
        await onDeviceManager.tapOpenPassphraseButton();
    }

    public async closePassphraseFlow() {
        await element(by.id('@passphrase/closeButton')).tap();
        await element(by.text('Cancel')).tap();
    }

    public async expectEnterPassphraseScreen() {
        await waitForVisible(by.id('@screen/PassphraseForm'));
    }

    public async enterPassphrase(passphrase: string) {
        const passphraseInput = element(by.id('@passphrase/passphraseInput'));
        await passphraseInput.tap();
        await passphraseInput.replaceText(passphrase);
        await element(by.id('@passphrase/confirmButton')).tap();
    }

    public async allowPassphraseOnEmu() {
        if (getModelFromEnv() === 'T3W1') {
            await TrezorUserEnvLink.pressYes();
            await TrezorUserEnvLink.pressYes();

            return;
        }

        await TrezorUserEnvLink.swipeEmu('up');
        await TrezorUserEnvLink.swipeEmu('up');
        await TrezorUserEnvLink.pressYes();
    }

    public async expectConfirmPassphraseOnDeviceRequest() {
        await waitForVisible(by.id('@screen/PassphraseConfirmOnTrezor'));
    }

    public async confirmPassphraseOnEmu() {
        if (getModelFromEnv() === 'T3W1') {
            await TrezorUserEnvLink.pressYes();
            await TrezorUserEnvLink.pressYes();

            return;
        }

        await TrezorUserEnvLink.swipeEmu('up');
        await TrezorUserEnvLink.swipeEmu('up');
        await TrezorUserEnvLink.pressYes();
    }

    public async expectEmptyPassphraseWalletScreen() {
        await waitForVisible(by.id('@screen/PassphraseEmptyWallet'));
    }

    public async openEmptyPassphraseWalletAndConfirmBestPractices() {
        await element(by.id('@passphrase/emptyPassphraseWallet/confirmButton')).tap();
        await waitForVisible(by.text('Passphrase best practices'));
        await element(by.text('Got it')).tap();
    }

    public async expectEmptyPassphraseWalletConfirmationScreen() {
        await waitForVisible(by.id('@screen/PassphraseVerifyEmptyWallet'));
    }

    public async expectSwitcherSubheader(expectedText: string) {
        const subheaderTestID = '@deviceManager/walletDetail/subheader';
        await waitForVisible(by.id(subheaderTestID));
        await detoxExpect(element(by.id(subheaderTestID))).toHaveText(expectedText);
    }

    public async openPassphraseWallet(
        passphrase: string,
        options?: { dismissDuplicatePassphraseAlert: boolean },
    ) {
        await this.openNewPassphraseFlow();

        await this.expectEnterPassphraseScreen();
        await this.enterPassphrase(passphrase);

        await this.expectConfirmPassphraseOnDeviceRequest();
        await this.confirmPassphraseOnEmu();

        if (options?.dismissDuplicatePassphraseAlert) {
            await waitForVisible(by.text('Passphrase duplicate'));
            await element(by.id('@alert-sheet/primary-button')).tap();
        }
    }
}

export const onPassphrase = new PassphraseModule();
