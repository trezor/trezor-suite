import { D } from '@mobily/ts-belt';

import { BigNumber } from '@trezor/utils/src/bigNumber';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import { getNetworkType } from '@suite-common/wallet-config';
import { isNftTokenTransfer } from '@suite-common/wallet-utils';

import type { TokenDefinitions } from './tokenDefinitionsTypes';
import { isTokenDefinitionKnown } from './tokenDefinitionsUtils';

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

export const getIsPhishingTransaction = (
    transaction: WalletAccountTransaction,
    tokenDefinitions: TokenDefinitions,
) =>
    getNetworkType(transaction.symbol) === 'ethereum' &&
    (getIsZeroValuePhishing(transaction) ||
        (D.isNotEmpty(tokenDefinitions) && // at least one token definition is available
            getIsFakeTokenPhishing(transaction, tokenDefinitions)));
