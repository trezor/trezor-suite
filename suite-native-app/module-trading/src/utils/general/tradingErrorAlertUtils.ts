import { type TradingErrorCode } from '@suite-common/trading';
import { type TxKeyPath } from '@suite-native/intl';

const TRADING_ERROR_ALERT_DESCRIPTION_IDS = {
    'cannot-send-transaction':
        'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
    'cannot-create-transaction':
        'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
    'compose-failed': 'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
    'missing-composed-data':
        'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
    'missing-fee-level':
        'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
    'incorrect-serialized-data':
        'moduleTrading.tradingReviewOutputs.errorAlert.prepareTransactionDescription',
    'refresh-transaction-failed':
        'moduleTrading.tradingReviewOutputs.errorAlert.quoteExpiredDescription',
    'no-response': 'moduleTrading.tradingReviewOutputs.errorAlert.providerNoResponseDescription',
    'invalid-response':
        'moduleTrading.tradingReviewOutputs.errorAlert.providerNoResponseDescription',
    'payment-requests-failed':
        'moduleTrading.tradingReviewOutputs.errorAlert.paymentRequestDescription',
    'device-not-connected':
        'moduleTrading.tradingReviewOutputs.errorAlert.deviceNotConnectedDescription',
    'nonce-failed': 'moduleTrading.tradingReviewOutputs.errorAlert.nonceDescription',
    'verify-address-failed':
        'moduleTrading.tradingReviewOutputs.errorAlert.verifyAddressDescription',
} as const satisfies Record<TradingErrorCode, TxKeyPath>;

export const getTradingErrorAlertDescriptionId = (code: TradingErrorCode): TxKeyPath =>
    TRADING_ERROR_ALERT_DESCRIPTION_IDS[code];
