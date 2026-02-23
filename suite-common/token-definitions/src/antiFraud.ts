import { D } from '@mobily/ts-belt';

import { NetworkSymbol, NetworkType, getNetworkType } from '@suite-common/wallet-config';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { isNftTokenTransfer } from '@suite-common/wallet-utils';
import { InternalTransfer, TokenTransfer } from '@trezor/blockchain-link-types';
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

// dust threshold in USD
export const DUST_PHISHING_THRESHOLD = '0.001';

export const getIsDustValuePhishing: PhishingDetectorFn = ({ transaction }) => {
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

    // if the total fiat amount is zero, don't consider it as dust
    if (totalFiatAmount.isEqualTo(0)) return false;

    return totalFiatAmount.isLessThanOrEqualTo(DUST_PHISHING_THRESHOLD);
};

export const getIsZeroValuePhishing: PhishingDetectorFn = ({ transaction }) =>
    new BigNumber(transaction.amount).isEqualTo(0) &&
    D.isNotEmpty(transaction.tokens) &&
    transaction.tokens.every(token => new BigNumber(token.amount).isEqualTo(0));

export const getIsFakeTokenPhishing: PhishingDetectorFn = ({ transaction, tokenDefinitions }) =>
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

export const getIsUnknownTxPhishing: PhishingDetectorFn = ({ transaction }) =>
    transaction.type === 'unknown';

const detectors = {
    dustValue: getIsDustValuePhishing,
    zeroValue: getIsZeroValuePhishing,
    fakeToken: getIsFakeTokenPhishing,
    unknownTx: getIsUnknownTxPhishing,
} as const;

type NetworkPhishingDetectors = Map<NetworkType, PhishingDetectorFn[]>;

const phishingDetectors: NetworkPhishingDetectors = new Map([
    ['bitcoin', []],
    ['ethereum', [detectors.dustValue, detectors.zeroValue, detectors.fakeToken]],
    ['ripple', [detectors.dustValue]],
    ['cardano', [detectors.dustValue, detectors.fakeToken]],
    ['solana', [detectors.dustValue, detectors.fakeToken]],
    ['stellar', [detectors.dustValue, detectors.fakeToken, detectors.unknownTx]],
    ['tron', [detectors.dustValue, detectors.fakeToken]],
]);

// NOTE: This function determins, for which symbols there are filters in the UI to hide / display spam transactions
// when handling fraud for other symbols, make sure this function is updated!
export const hasNetworkPotentialFraudTransactions = (symbol: NetworkSymbol) =>
    phishingDetectors.has(getNetworkType(symbol));

export const getIsPhishingTransaction = (
    transaction: TransactionWithFiatAmount,
    tokenDefinitions: TokenDefinitions,
) => {
    const networkType = getNetworkType(transaction.symbol);
    const networkDetectors = phishingDetectors.get(networkType);

    if (!networkDetectors || networkDetectors.length === 0) return false;

    return networkDetectors.some(detector => detector({ transaction, tokenDefinitions }));
};
