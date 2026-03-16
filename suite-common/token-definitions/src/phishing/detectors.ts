import { D } from '@mobily/ts-belt';

import { isNftTokenTransfer } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { isTokenDefinitionKnown } from '../tokenDefinitionsUtils';
import { DUST_PHISHING_THRESHOLD } from './constants';
import { PhishingDetectorFn } from './types';
import { isTransactionWhitelisted } from './utils';

const isDustValuePhishing: PhishingDetectorFn = ({ transaction }) => {
    if (isTransactionWhitelisted(transaction)) return false;

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

const isZeroValuePhishing: PhishingDetectorFn = ({ transaction }) =>
    !isTransactionWhitelisted(transaction) &&
    new BigNumber(transaction.amount).isEqualTo(0) &&
    D.isNotEmpty(transaction.tokens) &&
    transaction.tokens.every(token => new BigNumber(token.amount).isEqualTo(0));

const isFakeTokenPhishing: PhishingDetectorFn = ({ transaction, tokenDefinitions }) =>
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

const isUnknownTxPhishing: PhishingDetectorFn = ({ transaction }) =>
    !isTransactionWhitelisted(transaction) && transaction.type === 'unknown';

export const detectors = {
    dustValue: isDustValuePhishing,
    zeroValue: isZeroValuePhishing,
    fakeToken: isFakeTokenPhishing,
    unknownTx: isUnknownTxPhishing,
} as const satisfies Record<string, PhishingDetectorFn>;
