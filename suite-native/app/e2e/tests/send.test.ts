import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import {
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    restartApp,
    wait,
} from '../utils';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onCoinEnablingInit } from '../pageObjects/coinEnablingActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onSendOutputsForm } from '../pageObjects/send/sendOutputsFormActions';
import { onSendFees } from '../pageObjects/send/sendFeesActions';
import { onSendAddressReview } from '../pageObjects/send/sendAddressReviewActions';
import { onSendOutputsReview } from '../pageObjects/send/sendOutputsReviewActions';
import { onHome } from '../pageObjects/homeActions';
import { onAlertSheet } from '../pageObjects/alertSheetActions';

export const SEND_FORM_ERROR_MESSAGES = {
    invalidAddress: 'The address format is incorrect.',
    invalidDecimalValue: 'Invalid decimal value.',
    dustAmount: 'The value is lower than the dust limit.',
    higherThanBalance: 'You don’t have enough balance to send this amount.',
    tooManyDecimals: 'Too many decimals.',
    addressRequired: 'Address is required.',
    amountRequired: 'Amount is required.',
};

const INITIAL_ACCOUNT_BALANCE = 3.14;

const platform = device.getPlatform();

const prepareTransactionForOnDeviceReview = async (isFormEmpty: boolean = true) => {
    if (isFormEmpty) {
        await onSendOutputsForm.fillForm([
            { address: 'bcrt1q34up3cga3fkmph47t22mpk5d0xxj3ppghph9da', amount: '0.5' },
        ]);
    }

    await onSendOutputsForm.submitForm();

    await onSendFees.selectFee('normal');
    await onSendFees.submitFee();
};

describe('Send transaction flow.', () => {
    beforeAll(async () => {
        await prepareTrezorEmulator();
        await openApp({ newInstance: true });
        await onOnboarding.finishOnboarding();

        await TrezorUserEnvLink.sendToAddressAndMineBlock({
            address: 'bcrt1q34up3cga3fkmph47t22mpk5d0xxj3ppghph9da',
            btc_amount: INITIAL_ACCOUNT_BALANCE,
        });

        await onCoinEnablingInit.waitForScreen();
        await onCoinEnablingInit.enableNetwork('regtest');
        await onCoinEnablingInit.clickOnConfirmButton();

        await waitFor(element(by.id('skip-view-only-mode')))
            .toBeVisible()
            .withTimeout(10000); // communication between connected Trezor and app takes some time.

        await element(by.id('skip-view-only-mode')).tap();
    });

    beforeEach(async () => {
        await prepareTrezorEmulator();
        await restartApp();

        await appIsFullyLoaded();
        if (platform !== 'android')
            return test.skip(`Sending transactions is not supported on ${platform}.`);

        await waitFor(element(by.id('@screen/ConnectingDevice')))
            .toBeVisible()
            .withTimeout(10000);

        await onHome.waitForScreen();
        await onTabBar.navigateToMyAssets();

        await onMyAssets.openAccountDetail({ accountName: 'Bitcoin Regtest #1' });

        await onAccountDetail.openSend();
        await onSendOutputsForm.waitForScreen();
    });

    afterAll(() => {
        disconnectTrezorUserEnv();
    });

    it('Compose and dispatch a regtest transaction.', async () => {
        await prepareTransactionForOnDeviceReview();

        await onSendAddressReview.nextStep();
        await onSendAddressReview.nextStep();
        await TrezorUserEnvLink.pressYes();

        await onSendOutputsReview.waitForScreen();
        await onSendOutputsReview.confirmTransactionOutputs();
        await onSendOutputsReview.clickSendTransaction();
    });

    it('Validate send form input errors.', async () => {
        await onSendOutputsForm.fillForm([{ address: 'wrong address', amount: '200' }]);

        await waitFor(element(by.text(SEND_FORM_ERROR_MESSAGES.invalidAddress))).toBeVisible();
        await waitFor(element(by.text(SEND_FORM_ERROR_MESSAGES.higherThanBalance))).toBeVisible();

        await onSendOutputsForm.clearForm();

        await waitFor(element(by.text(SEND_FORM_ERROR_MESSAGES.addressRequired))).toBeVisible();
        await waitFor(element(by.text(SEND_FORM_ERROR_MESSAGES.amountRequired))).toBeVisible();

        await onSendOutputsForm.fillForm([{ amount: '0.00000001' }]);
        await waitFor(element(by.text(SEND_FORM_ERROR_MESSAGES.dustAmount))).toBeVisible();

        await onSendOutputsForm.clearForm();

        await onSendOutputsForm.fillForm([{ amount: '0.10000000000' }]);
        await waitFor(element(by.text(SEND_FORM_ERROR_MESSAGES.tooManyDecimals))).toBeVisible();
    });

    it('Review cancellation and error handling.', async () => {
        await prepareTransactionForOnDeviceReview();

        // Cancel button should go back if the on device review was not started yet.
        await element(by.id('@screen/sub-header/icon-left')).tap();
        await onSendFees.waitForScreen();

        // Cancel button should restart the review if it already started.
        await onSendFees.submitFee();
        await onSendAddressReview.nextStep();
        await onSendAddressReview.nextStep();
        await element(by.id('@screen/sub-header/icon-left')).tap();
        await onAlertSheet.tapPrimaryButton();
        await onAccountDetail.waitForScreen();

        // Disconnecting not remembered device should exit the send flow and display alert.
        await onAccountDetail.openSend();
        const isFormEmpty = false;
        await prepareTransactionForOnDeviceReview(isFormEmpty);
        await onSendAddressReview.nextStep();
        await onSendAddressReview.nextStep();

        await wait(3000); // Wait for the device to get info about the transaction.
        await TrezorUserEnvLink.stopEmu();
        await onAlertSheet.tapSecondaryButton();
        await onHome.waitForScreen();
    });
});
