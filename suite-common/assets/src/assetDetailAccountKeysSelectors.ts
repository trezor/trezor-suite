import { shallowEqual } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AssetAccountsRootState,
    type FiatRatesRootState,
    type PhishingRootState,
    type TransactionsRootState,
    selectDeviceAssetAccounts,
    selectIsAccountTransactionPhishing,
    selectTransactions,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import { isNftToken } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';
import { isNotNullOrUndefined } from '@trezor/utils';

export type AssetDetailState = AssetAccountsRootState &
    TransactionsRootState &
    FiatRatesRootState &
    PhishingRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AssetDetailState>();

const hasAccountToken = (account: Account, tokenContract: TokenAddress) =>
    account.tokens?.some(token => token.contract === tokenContract && !isNftToken(token)) ?? false;

const selectNetworkSymbolParam = (_state: AssetDetailState, networkSymbol: NetworkSymbol) =>
    networkSymbol;

const selectTokenContractParam = (
    _state: AssetDetailState,
    _networkSymbol: NetworkSymbol,
    tokenContract?: TokenAddress,
) => tokenContract;

const selectWalletAssetCandidateAccounts = createMemoizedSelector(
    [selectVisibleDeviceAccountsByNetworkSymbol, selectTokenContractParam],
    (accounts, tokenContract) =>
        returnStableArrayIfEmpty(
            accounts.filter(
                account =>
                    !account.failed &&
                    (tokenContract === undefined || hasAccountToken(account, tokenContract)),
            ),
        ),
);

export const selectWalletAssetCandidateAccountKeys = createMemoizedSelector(
    [selectWalletAssetCandidateAccounts],
    (accounts): readonly AccountKey[] =>
        returnStableArrayIfEmpty(accounts.map(account => account.key)),
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

// A listed token may be an unsolicited airdrop, so an emptied one counts only with a genuine transfer.
export const selectWalletAssetAccountKeys = createMemoizedSelector(
    [
        selectWalletAssetCandidateAccounts,
        selectDeviceAssetAccounts,
        selectTransactions,
        selectIsAccountTransactionPhishing,
        selectNetworkSymbolParam,
        selectTokenContractParam,
    ],
    (
        accounts,
        assetAccounts,
        transactionsByAccount,
        isAccountTransactionPhishing,
        networkSymbol,
        tokenContract,
    ): readonly AccountKey[] => {
        const holdingAccountKeys = new Set(
            assetAccounts
                .filter(
                    assetAccount =>
                        assetAccount.symbol === networkSymbol &&
                        assetAccount.contractAddress === tokenContract,
                )
                .map(assetAccount => assetAccount.accountKey),
        );

        const hasGenuineTransferOfToken = (account: Account, contract: TokenAddress) =>
            (transactionsByAccount[account.key] ?? [])
                .filter(isNotNullOrUndefined)
                .some(
                    transaction =>
                        transaction.tokens.some(token => token.contract === contract) &&
                        !isAccountTransactionPhishing(account.key, transaction),
                );

        const isAssetAccount = (account: Account) =>
            tokenContract === undefined ||
            holdingAccountKeys.has(account.key) ||
            hasGenuineTransferOfToken(account, tokenContract);

        return returnStableArrayIfEmpty(
            accounts.filter(isAssetAccount).map(account => account.key),
        );
    },
    { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);
