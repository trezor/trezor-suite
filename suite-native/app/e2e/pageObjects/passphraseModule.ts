import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onDeviceManager } from './deviceManagerActions';
import { getModelFromEnv } from '../support/setup';
import { waitForElementByIdToBeVisible, waitForElementByTextToBeVisible } from '../support/utils';

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
        await waitForElementByIdToBeVisible('@screen/PassphraseForm');
    }

    public async enterPassphrase(passphrase: string) {
        const inputTestId = '@passphrase/passphraseInput';
        await element(by.id(inputTestId)).tap();
        await element(by.id(inputTestId)).replaceText(passphrase);
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
        await waitForElementByIdToBeVisible('@screen/PassphraseConfirmOnTrezor');
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
        await waitForElementByIdToBeVisible('@screen/PassphraseEmptyWallet');
    }

    public async openEmptyPassphraseWalletAndConfirmBestPractices() {
        await element(by.id('@passphrase/emptyPassphraseWallet/confirmButton')).tap();
        await waitForElementByTextToBeVisible('Passphrase best practices');
        await element(by.text('Got it')).tap();
    }

    public async expectEmptyPassphraseWalletConfirmationScreen() {
        await waitForElementByIdToBeVisible('@screen/PassphraseVerifyEmptyWallet');
    }

    public async expectSwitcherSubheader(expectedText: string) {
        const subheaderTestID = '@deviceManager/walletDetail/subheader';
        await waitForElementByIdToBeVisible(subheaderTestID);
        await detoxExpect(element(by.id(subheaderTestID))).toHaveText(expectedText);
    }

    public async openPassphraseWallet(passphrase: string) {
        await this.openNewPassphraseFlow();

        await this.expectEnterPassphraseScreen();
        await this.enterPassphrase(passphrase);

        await this.expectConfirmPassphraseOnDeviceRequest();
        await this.confirmPassphraseOnEmu();

        try {
            // If trying to open an already open passphrase wallet, just confirm the alert.
            await waitForElementByTextToBeVisible('Passphrase duplicate', 5000);
            await element(by.id('@alert-sheet/primary-button')).tap();
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
            // Newly opened wallet, do nothing.
        }
    }
}

export const onPassphrase = new PassphraseModule();
