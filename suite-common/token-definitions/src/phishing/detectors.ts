import { D } from '@mobily/ts-belt';

import { isNftTokenTransfer } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { isTokenDefinitionKnown } from '../tokenDefinitionsUtils';
import {
    type PhishingDetectorFn,
    type TokenTransferWithFiatAmount,
    type TransactionWithFiatAmount,
} from './types';
import { isTransactionWhitelisted } from './utils';

const createResult = (isPhishing: boolean, transaction?: TransactionWithFiatAmount) => ({
    isPhishing,
    transaction,
});

const isDustValuePhishing: PhishingDetectorFn = ({ transaction, dustThreshold }) => {
    if (isTransactionWhitelisted(transaction)) {
        return createResult(false);
    }

    if (!dustThreshold) {
        return createResult(false);
    }

    const hasFiatAmount =
        !!transaction.amountInFiat &&
        transaction.tokens.every(token => !!token.amountInFiat) &&
        transaction.internalTransfers.every(internalTransfer => !!internalTransfer.amountInFiat);

    if (!hasFiatAmount) {
        return createResult(false);
    }

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

    const result = totalFiatAmount.isLessThanOrEqualTo(dustThreshold);

    return createResult(result, transaction);
};

const isZeroValuePhishing: PhishingDetectorFn = ({ transaction }) => {
    if (isTransactionWhitelisted(transaction)) {
        return createResult(false);
    }

    if (!new BigNumber(transaction.amount).isEqualTo(0)) {
        return createResult(false);
    }

    if (D.isEmpty(transaction.tokens)) {
        return createResult(false);
    }

    if (!transaction.tokens.every(token => new BigNumber(token.amount).isEqualTo(0))) {
        return createResult(false);
    }

    return createResult(true, transaction);
};

const isFakeTokenPhishing: PhishingDetectorFn = ({ transaction, tokenDefinitions }) => {
    if (
        !tokenDefinitions ||
        D.isEmpty(tokenDefinitions) ||
        new BigNumber(transaction.amount).gt(0) ||
        D.isEmpty(transaction.tokens)
    ) {
        return createResult(false);
    }

    const fakeTokens: TokenTransferWithFiatAmount[] = [];
    let legitTokens: TokenTransferWithFiatAmount[] = [];

    for (const token of transaction.tokens) {
        if (new BigNumber(token.amount).isEqualTo(0)) {
            fakeTokens.push(token);
            continue;
        }

        const definition = isNftTokenTransfer(token)
            ? tokenDefinitions?.nft
            : tokenDefinitions?.coin;

        const isHidden = definition?.hide?.includes(token.contract);
        const isShown = definition?.show?.includes(token.contract);

        const isLegit =
            (isTokenDefinitionKnown(definition?.data, transaction.symbol, token.contract) ||
                isShown) &&
            !isHidden;

        if (isLegit) {
            legitTokens.push(token);
        } else {
            fakeTokens.push(token);
        }
    }

    // if the transaction is a receive transaction and there is at least one fake token
    // classify legit tokens with no fiat amount as fake tokens as well
    if ((transaction.type === 'recv' || transaction.type === 'contract') && fakeTokens.length > 0) {
        legitTokens = legitTokens.filter(legitToken => {
            if (!legitToken.amountInFiat) {
                fakeTokens.push(legitToken);

                return false;
            }

            return true;
        });
    }

    const result = legitTokens.length === 0 && fakeTokens.length === transaction.tokens.length;

    return createResult(result, { ...transaction, tokens: legitTokens });
};

const isUnknownTxPhishing: PhishingDetectorFn = ({ transaction }) => {
    if (isTransactionWhitelisted(transaction)) {
        return createResult(false);
    }

    return createResult(transaction.type === 'unknown', transaction);
};

export const detectors = {
    dustValue: isDustValuePhishing,
    zeroValue: isZeroValuePhishing,
    fakeToken: isFakeTokenPhishing,
    unknownTx: isUnknownTxPhishing,
} as const satisfies Record<string, PhishingDetectorFn>;
