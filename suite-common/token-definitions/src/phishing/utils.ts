import {
    type RatesByTimestamps,
    type Timestamp,
    type TokenAddress,
    type WalletAccountTransaction,
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
import { type TransactionWithFiatAmount } from './types';

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
