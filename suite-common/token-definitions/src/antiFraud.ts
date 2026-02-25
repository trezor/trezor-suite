import { D } from '@mobily/ts-belt';

import {
    NetworkSymbol,
    NetworkType,
    getNetworkFeatures,
    getNetworkType,
} from '@suite-common/wallet-config';
import type {
    RatesByTimestamps,
    Timestamp,
    TokenAddress,
    WalletAccountTransaction,
} from '@suite-common/wallet-types';
import {
    asAmountSubunit,
    getFiatRateKey,
    isNftTokenTransfer,
    roundTimestampToNearestPastHour,
    subunitsToUnits,
    toFiatCurrency,
} from '@suite-common/wallet-utils';
import { BaseCurrencyCode, InternalTransfer, TokenTransfer } from '@trezor/blockchain-link-types';
import { BigNumber } from '@trezor/utils';

import type { TokenDefinitions } from './tokenDefinitionsTypes';
import { isTokenDefinitionKnown } from './tokenDefinitionsUtils';

export interface TokenTransferWithFiatAmount extends TokenTransfer {
    amountInFiat?: string;
}

export interface InternalTransferWithFiatAmount extends InternalTransfer {
    amountInFiat?: string;
}

export interface TransactionWithFiatAmount extends WalletAccountTransaction {
    amountInFiat?: string;
    tokens: TokenTransferWithFiatAmount[];
    internalTransfers: InternalTransferWithFiatAmount[];
}

type PhishingDetectorFnProps = {
    transaction: TransactionWithFiatAmount;
    tokenDefinitions?: TokenDefinitions;
};

type PhishingDetectorFn = (props: PhishingDetectorFnProps) => boolean;

/** The dust threshold is in fiat (USD), as we want to detect economically meaningful dust-sized value movements */
export const DUST_PHISHING_THRESHOLD = '0.005';
const DUST_PHISHING_THRESHOLD_CURRENCY = 'usd' satisfies BaseCurrencyCode;
/** Transaction types that are not considered during phishing detection */
const PHISHING_WHITELISTED_TX_TYPES: WalletAccountTransaction['type'][] = [
    'sent',
    'self',
    'contract',
];

export const isDustValuePhishing: PhishingDetectorFn = ({ transaction }) => {
    const hasFiatAmount =
        !!transaction.amountInFiat &&
        transaction.tokens.every(token => !!token.amountInFiat) &&
        transaction.internalTransfers.every(internalTransfer => !!internalTransfer.amountInFiat);

    if (!hasFiatAmount) return false;

    const nativeTokenFiatAmount = new BigNumber(transaction.amountInFiat ?? '0');

    const tokensFiatAmount = transaction.tokens.reduce(
        (acc, token) => acc.plus(new BigNumber(token.amountInFiat ?? '0')),
        new BigNumber('0'),
    );

    const internalTransfersFiatAmount = transaction.internalTransfers.reduce(
        (acc, internalTransfer) => acc.plus(new BigNumber(internalTransfer.amountInFiat ?? '0')),
        new BigNumber('0'),
    );

    // total fiat sum in order to answer if it's an economically meaningful dust-sized value movement
    const totalFiatAmount = nativeTokenFiatAmount
        .plus(tokensFiatAmount)
        .plus(internalTransfersFiatAmount);

    return totalFiatAmount.isLessThanOrEqualTo(DUST_PHISHING_THRESHOLD);
};

export const isZeroValuePhishing: PhishingDetectorFn = ({ transaction }) =>
    new BigNumber(transaction.amount).isEqualTo(0) &&
    D.isNotEmpty(transaction.tokens) &&
    transaction.tokens.every(token => new BigNumber(token.amount).isEqualTo(0));

export const isFakeTokenPhishing: PhishingDetectorFn = ({ transaction, tokenDefinitions }) =>
    !!tokenDefinitions &&
    D.isNotEmpty(tokenDefinitions) &&
    new BigNumber(transaction.amount).isEqualTo(0) && // native currency is zero
    D.isNotEmpty(transaction.tokens) && // there are tokens in tx
    !transaction.tokens.some(tokenTx => {
        if (new BigNumber(tokenTx.amount).isEqualTo(0)) {
            return false;
        }

        const isNftTx = isNftTokenTransfer(tokenTx);
        const definitions = isNftTx ? tokenDefinitions?.nft?.data : tokenDefinitions?.coin?.data;
        const hide = isNftTx ? tokenDefinitions?.nft?.hide : tokenDefinitions?.coin?.hide;
        const show = isNftTx ? tokenDefinitions?.nft?.show : tokenDefinitions?.coin?.show;

        const isHidden = hide?.includes(tokenTx.contract);
        const isShown = show?.includes(tokenTx.contract);

        return (
            (isTokenDefinitionKnown(definitions, transaction.symbol, tokenTx.contract) ||
                isShown) &&
            !isHidden
        );
    }); // there is hidden or unknown token in tx

export const isUnknownTxPhishing: PhishingDetectorFn = ({ transaction }) =>
    transaction.type === 'unknown';

const detectors = {
    dustValue: isDustValuePhishing,
    zeroValue: isZeroValuePhishing,
    fakeToken: isFakeTokenPhishing,
    unknownTx: isUnknownTxPhishing,
} as const satisfies Record<string, PhishingDetectorFn>;

type NetworkPhishingDetectors = Map<NetworkType, PhishingDetectorFn[]>;

const phishingDetectors: NetworkPhishingDetectors = new Map([
    ['ethereum', [detectors.dustValue, detectors.zeroValue, detectors.fakeToken]],
    ['ripple', [detectors.dustValue]],
    ['cardano', [detectors.dustValue, detectors.fakeToken]],
    ['solana', [detectors.dustValue, detectors.fakeToken]],
    ['stellar', [detectors.dustValue, detectors.fakeToken, detectors.unknownTx]],
    ['tron', [detectors.dustValue, detectors.fakeToken]],
]);

// NOTE: This function determines for which symbols there are filters in the UI to hide/display spam transactions
// when handling fraud for other symbols, make sure this function is updated!
export const hasNetworkPotentialFraudTransactions = (symbol: NetworkSymbol) =>
    phishingDetectors.has(getNetworkType(symbol));

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

interface IsPhishingTransactionProps {
    transaction?: WalletAccountTransaction;
    tokenDefinitions?: TokenDefinitions;
    historicRates?: RatesByTimestamps;
    txsMarkedAsNotScam: string[];
}

// NOTE: this is the single main function that is used
// across Suite to determine if a transaction is phishing
export const isPhishingTransaction = ({
    transaction,
    tokenDefinitions,
    historicRates,
    txsMarkedAsNotScam,
}: IsPhishingTransactionProps) => {
    if (!transaction) return false;

    if (PHISHING_WHITELISTED_TX_TYPES.includes(transaction.type)) return false;

    const { symbol } = transaction;
    const networkFeatures = getNetworkFeatures(symbol);
    const hasCoinDefinitionsFeature = networkFeatures.includes('coin-definitions');

    if (!tokenDefinitions && hasCoinDefinitionsFeature) return false;
    if (txsMarkedAsNotScam.includes(transaction.txid)) return false;

    const transactionWithFiatAmounts = getTransactionWithFiatAmounts({
        transaction,
        historicRates,
    });

    const networkType = getNetworkType(transactionWithFiatAmounts.symbol);
    const networkDetectors = phishingDetectors.get(networkType);

    if (!networkDetectors || networkDetectors.length === 0) return false;

    return networkDetectors.some(detector =>
        detector({ transaction: transactionWithFiatAmounts, tokenDefinitions }),
    );
};
