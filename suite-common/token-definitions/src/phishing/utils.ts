import type {
    RatesByTimestamps,
    Timestamp,
    TokenAddress,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getFiatRateKey,
    roundTimestampToNearestPastHour,
    subunitsToUnits,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { DUST_PHISHING_THRESHOLD_CURRENCY, PHISHING_WHITELISTED_TX_TYPES } from './constants';
import {
    type PhishingDetectorId,
    type PhishingTransactionValidatorResult,
    type TransactionWithFiatAmount,
} from './types';

export const isTransactionWhitelisted = (transaction: TransactionWithFiatAmount) =>
    PHISHING_WHITELISTED_TX_TYPES.includes(transaction.type);

interface GetTransactionAmountInFiatProps {
    transaction: WalletAccountTransaction;
    amount: string;
    contractAddress?: TokenAddress;
    decimals?: number;
    historicRates?: RatesByTimestamps;
}

const getTransactionAmountInFiat = ({
    transaction,
    amount,
    contractAddress,
    decimals,
    historicRates,
}: GetTransactionAmountInFiatProps) => {
    if (amount === '') return '0';

    const fiatRateKey = getFiatRateKey(
        transaction.symbol,
        DUST_PHISHING_THRESHOLD_CURRENCY,
        contractAddress,
    );
    const roundedTimestamp = roundTimestampToNearestPastHour(transaction.blockTime as Timestamp);

    const amountInUnits = subunitsToUnits(
        decimals
            ? {
                  value: asAmountSubunit(new BigNumber(amount)),
                  decimals,
              }
            : {
                  value: asAmountSubunit(new BigNumber(amount)),
                  symbol: transaction.symbol,
              },
    );

    const fiatRate = historicRates?.[fiatRateKey]?.[roundedTimestamp];

    return toFiatCurrency({ amount: amountInUnits, rate: fiatRate })?.toString();
};

interface GetTransactionWithFiatAmountsProps {
    transaction: WalletAccountTransaction;
    historicRates?: RatesByTimestamps;
}

export const getTransactionWithFiatAmounts = ({
    transaction,
    historicRates,
}: GetTransactionWithFiatAmountsProps): TransactionWithFiatAmount => ({
    ...transaction,
    amountInFiat: getTransactionAmountInFiat({
        transaction,
        amount: transaction.amount,
        historicRates,
    }),
    tokens: transaction.tokens.map(token => ({
        ...token,
        amountInFiat: getTransactionAmountInFiat({
            transaction,
            amount: token.amount,
            contractAddress: token.contract as TokenAddress,
            decimals: token.decimals,
            historicRates,
        }),
    })),
    internalTransfers: transaction.internalTransfers.map(internalTransfer => ({
        ...internalTransfer,
        amountInFiat: getTransactionAmountInFiat({
            transaction,
            amount: internalTransfer.amount,
            historicRates,
        }),
    })),
});

// stable references so Redux selectors / useSelector do not see a new object each run
const PHISHING_RESULT_FALSE: PhishingTransactionValidatorResult = { isPhishing: false };

const PHISHING_RESULT_TRUE_BY_DETECTOR: Record<
    PhishingDetectorId,
    PhishingTransactionValidatorResult
> = {
    FAKE_TOKEN: { isPhishing: true, detectorId: 'FAKE_TOKEN' },
    UNKNOWN_TX: { isPhishing: true, detectorId: 'UNKNOWN_TX' },
    DUST_AMOUNT: { isPhishing: true, detectorId: 'DUST_AMOUNT' },
    ZERO_AMOUNT: { isPhishing: true, detectorId: 'ZERO_AMOUNT' },
};

// fallback when `isPhishing` is true without a detector id
const PHISHING_RESULT_TRUE_UNSPECIFIED: PhishingTransactionValidatorResult = {
    isPhishing: true,
    detectorId: undefined,
};

export const createPhishingResult = (
    isPhishing: boolean,
    detectorId?: PhishingDetectorId,
): PhishingTransactionValidatorResult => {
    if (!isPhishing) {
        return PHISHING_RESULT_FALSE;
    }
    if (detectorId !== undefined) {
        return PHISHING_RESULT_TRUE_BY_DETECTOR[detectorId];
    }

    return PHISHING_RESULT_TRUE_UNSPECIFIED;
};
