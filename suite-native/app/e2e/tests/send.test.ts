import { expect as detoxExpect } from 'detox';

import { Model, TrezorUserEnvLink } from '@trezor/trezor-user-env-link';

import { onboardingCompletedState } from '../fixtures/onboardingCompletedState';
import { regtestDiscoveryFinishedStateT3T1 } from '../fixtures/regtestDiscoveryFinishedStateT3T1';
import { regtestDiscoveryFinishedStateT3W1 } from '../fixtures/regtestDiscoveryFinishedStateT3W1';
import { onAccountDetail } from '../pageObjects/accountDetailActions';
import { onHome } from '../pageObjects/homeActions';
import { onMyAssets } from '../pageObjects/myAssetsActions';
import { onSendAddressReview } from '../pageObjects/send/sendAddressReviewActions';
import { FeeValues, onSendFees } from '../pageObjects/send/sendFeesActions';
import { onSendOutputsForm } from '../pageObjects/send/sendOutputsFormActions';
import { onSendOutputsReview } from '../pageObjects/send/sendOutputsReviewActions';
import { onTabBar } from '../pageObjects/tabBarActions';
import { openApp, preparePreloadedReduxState, prepareTrezorEmulator } from '../support/setup';
import { getModelFromEnv } from '../support/utils';

const SEND_FORM_ERROR_MESSAGES = {
    invalidAddress: 'The address format is incorrect.',
    invalidDecimalValue: 'Invalid decimal value.',
    dustAmount: 'The value is lower than the dust limit.',
    higherThanBalance: 'You don’t have enough balance to send this amount.',
    tooManyDecimals: 'Too many decimals.',
    addressRequired: 'Field is mandatory',
    amountRequired: 'Amount is required.',
};

const INITIAL_ACCOUNT_BALANCE = 3.14;

const prepareTransactionForOnDeviceReview = async ({
    feeValues,
    isFormEmpty = true,
    recipientValues = [{ address: 'bcrt1q34up3cga3fkmph47t22mpk5d0xxj3ppghph9da', amount: '0.5' }],
}: {
    recipientValues?: { address: string; amount: string }[];
    feeValues?: FeeValues;
    isFormEmpty?: boolean;
}) => {
    if (isFormEmpty) {
        await onSendOutputsForm.fillForm(recipientValues);
    }

    await onSendOutputsForm.submitForm();

    if (feeValues) {
        await onSendFees.selectFee(feeValues);
    }

    await onSendFees.submitFee();
};

const signTransactionAndSendIt = async () => {
    await onSendAddressReview.nextStep();
    await onSendAddressReview.nextStep();
    await TrezorUserEnvLink.pressYes();

    await onSendOutputsReview.waitForScreen();
    await onSendOutputsReview.confirmTransactionOutputs();
    await onSendOutputsReview.clickSendTransaction();
};

const preloadedState = preparePreloadedReduxState(
    onboardingCompletedState,
    getModelFromEnv() === Model.T3T1
        ? regtestDiscoveryFinishedStateT3T1
        : regtestDiscoveryFinishedStateT3W1,
);

describe('Send transaction flow. [@androidOnly @smoke @T3T1 @T3W1]', () => {
    beforeAll(async () => {
        await TrezorUserEnvLink.sendToAddressAndMineBlock({
            address: 'bcrt1q34up3cga3fkmph47t22mpk5d0xxj3ppghph9da',
            btc_amount: INITIAL_ACCOUNT_BALANCE,
        });
    });

    beforeEach(async () => {
        await openApp({ args: { preloadedState } });
        await prepareTrezorEmulator();

        await onHome.waitForScreen();
        await onTabBar.navigateToMyAssets();

        await onMyAssets.openAccountDetail({ accountName: 'Bitcoin Regtest #1' });

        await onAccountDetail.openSend();
        await onSendOutputsForm.waitForScreen();
    });

    it('Compose and dispatch a regtest transaction.', async () => {
        await prepareTransactionForOnDeviceReview({ isFormEmpty: true });

        await signTransactionAndSendIt();
    });

    it('Compose and dispatch a regtest transaction with a custom fee.', async () => {
        await prepareTransactionForOnDeviceReview({
            feeValues: { feeType: 'custom', customFeePerUnit: '100' },
        });

        await signTransactionAndSendIt();
    });

    it('Validate send form input errors.', async () => {
        await onSendOutputsForm.fillForm([{ address: 'wrong address', amount: '200' }]);

        await detoxExpect(element(by.text(SEND_FORM_ERROR_MESSAGES.invalidAddress))).toBeVisible();
        await detoxExpect(
            element(by.text(SEND_FORM_ERROR_MESSAGES.higherThanBalance)),
        ).toBeVisible();

        await onSendOutputsForm.clearForm();
        await detoxExpect(element(by.text(SEND_FORM_ERROR_MESSAGES.addressRequired))).toBeVisible();
        await detoxExpect(element(by.text(SEND_FORM_ERROR_MESSAGES.amountRequired))).toBeVisible();

        await onSendOutputsForm.fillForm([{ amount: '0.00000001' }]);
        await detoxExpect(element(by.text(SEND_FORM_ERROR_MESSAGES.dustAmount))).toBeVisible();

        await onSendOutputsForm.clearForm();

        await onSendOutputsForm.fillForm([{ amount: '0.10000000000' }]);
        await detoxExpect(element(by.text(SEND_FORM_ERROR_MESSAGES.tooManyDecimals))).toBeVisible();
    });
});
