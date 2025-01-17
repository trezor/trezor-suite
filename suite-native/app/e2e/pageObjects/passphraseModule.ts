import { expect as detoxExpect } from 'detox';

import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { waitForElementByIdToBeVisible, waitForElementByTextToBeVisible } from '../utils';
import { onDeviceManager } from './deviceManagerActions';

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

    public async expectEnablePassphraseOnDeviceRequest() {
        await waitForElementByIdToBeVisible('@screen/PassphraseEnableOnDevice');
    }

    public async allowPassphraseOnEmu() {
        await TrezorUserEnvLink.swipeEmu('up');
        await TrezorUserEnvLink.swipeEmu('up');
        await TrezorUserEnvLink.pressYes();
    }

    public async expectConfirmPassphraseOnDeviceRequest() {
        await waitForElementByIdToBeVisible('@screen/PassphraseConfirmOnTrezor');
    }

    public async confirmPassphraseOnEmu() {
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
}

export const onPassphrase = new PassphraseModule();
