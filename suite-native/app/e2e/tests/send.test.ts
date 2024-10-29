import { conditionalDescribe } from '@suite-common/test-utils';
import { TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onAlertSheet } from '../pageObjects/alertSheetActions';
import { onBottomSheet } from '../pageObjects/bottomSheetActions';
import { onCoinEnablingInit } from '../pageObjects/coinEnablingActions';
import { onConnectingDevice } from '../pageObjects/connectingDevice';
import { onHome } from '../pageObjects/homeActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onOnboarding } from '../pageObjects/onboardingActions';
import { onSendAddressReview } from '../pageObjects/send/sendAddressReviewActions';
import { onSendFees } from '../pageObjects/send/sendFeesActions';
import { onSendOutputsForm } from '../pageObjects/send/sendOutputsFormActions';
import { onSendOutputsReview } from '../pageObjects/send/sendOutputsReviewActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import {
    appIsFullyLoaded,
    disconnectTrezorUserEnv,
    openApp,
    prepareTrezorEmulator,
    restartApp,
    wait,
} from '../utils';

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

const prepareTransactionForOnDeviceReview = async (isFormEmpty: boolean = true) => {
    if (isFormEmpty) {
        await onSendOutputsForm.fillForm([
            { address: 'bcrt1q34up3cga3fkmph47t22mpk5d0xxj3ppghph9da', amount: '0.5' },
        ]);
    }

    await onSendOutputsForm.submitForm();

    await onSendFees.submitFee();
};

conditionalDescribe(device.getPlatform() !== 'android', 'Send transaction flow.', () => {
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

        await onBottomSheet.skipViewOnlyMode();
    });

    beforeEach(async () => {
        await prepareTrezorEmulator();
        await restartApp();

        await appIsFullyLoaded();

        await onConnectingDevice.waitForScreen();
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
