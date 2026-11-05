import { type TradingErrorCode } from '@suite-common/trading';
import { type TxKeyPath, getTranslation } from '@suite-native/intl';

import { getTradingErrorAlertDescriptionId } from './tradingErrorAlertUtils';

describe('getTradingErrorAlertDescriptionId', () => {
    it.each<[TradingErrorCode, TxKeyPath]>([
        [
            'cannot-send-transaction',
            'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
        ],
        [
            'cannot-create-transaction',
            'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
        ],
        [
            'compose-failed',
            'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
        ],
        [
            'missing-composed-data',
            'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
        ],
        [
            'missing-fee-level',
            'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
        ],
        [
            'incorrect-serialized-data',
            'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
        ],
        [
            'refresh-transaction-failed',
            'moduleTrading.tradingReviewOutputs.errorAlert.quoteExpiredDescription',
        ],
        [
            'no-response',
            'moduleTrading.tradingReviewOutputs.errorAlert.providerNoResponseDescription',
        ],
        [
            'invalid-response',
            'moduleTrading.tradingReviewOutputs.errorAlert.providerNoResponseDescription',
        ],
        [
            'payment-requests-failed',
            'moduleTrading.tradingReviewOutputs.errorAlert.paymentRequestDescription',
        ],
        [
            'device-not-connected',
            'moduleTrading.tradingReviewOutputs.errorAlert.deviceNotConnectedDescription',
        ],
        ['nonce-failed', 'moduleTrading.tradingReviewOutputs.errorAlert.nonceDescription'],
        [
            'verify-address-failed',
            'moduleTrading.tradingReviewOutputs.errorAlert.verifyAddressDescription',
        ],
    ])('should describe %s with its Trade wording', (code, expectedDescriptionId) => {
        const descriptionId = getTradingErrorAlertDescriptionId(code);

        expect(descriptionId).toBe(expectedDescriptionId);
        expect(getTranslation(descriptionId)).toEqual(expect.any(String));
    });
});
