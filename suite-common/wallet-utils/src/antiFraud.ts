import { D } from '@mobily/ts-belt';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { TokenDefinitions, isTokenDefinitionKnown } from '@suite-common/token-definitions';
import { getNetworkType } from '@suite-common/wallet-config';

import { isNftTokenTransfer } from './transactionUtils';

export const getIsZeroValuePhishing = (transaction: WalletAccountTransaction) =>
    new BigNumber(transaction.amount).isEqualTo(0) &&
    D.isNotEmpty(transaction.tokens) &&
    transaction.tokens.every(token => new BigNumber(token.amount).isEqualTo(0));

export const getIsFakeTokenPhishing = (
    transaction: WalletAccountTransaction,
    tokenDefinitions: TokenDefinitions,
) =>
    new BigNumber(transaction.amount).isEqualTo(0) && // native currency is zero
    D.isNotEmpty(transaction.tokens) && // there are tokens in tx
    !transaction.tokens.some(tokenTx => {
        const isNftTx = isNftTokenTransfer(tokenTx);
        const definitions = isNftTx ? tokenDefinitions?.nft?.data : tokenDefinitions?.coin?.data;

        return isTokenDefinitionKnown(definitions, transaction.symbol, tokenTx.contract);
    }); // all tokens are unknown

export const getIsPhishingTransaction = (
    transaction: WalletAccountTransaction,
    tokenDefinitions: TokenDefinitions,
) =>
    getNetworkType(transaction.symbol) === 'ethereum' &&
    (getIsZeroValuePhishing(transaction) ||
        (D.isNotEmpty(tokenDefinitions) && // at least one token definition is available
            getIsFakeTokenPhishing(transaction, tokenDefinitions)));
