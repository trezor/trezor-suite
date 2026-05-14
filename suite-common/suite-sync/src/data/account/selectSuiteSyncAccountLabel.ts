import { createWeakMapSelector } from '@suite-common/redux-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, WalletDescriptor } from '@suite-common/wallet-types';

import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { findSuiteSyncAccountLabel } from './findSuiteSyncAccountLabel';
import { selectAllAccountsForWallet } from '../wallet/suiteSyncWalletSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncDataRootState>();

export const selectSuiteSyncAccountLabel = createMemoizedSelector(
    [
        (state: SuiteSyncDataRootState, walletDescriptor: WalletDescriptor | null) =>
            selectAllAccountsForWallet(state, walletDescriptor),
        (
            _state: SuiteSyncDataRootState,
            _walletDescriptor: WalletDescriptor | null,
            accountDescriptor: AccountDescriptor,
        ) => accountDescriptor,
        (
            _state: SuiteSyncDataRootState,
            _walletDescriptor: WalletDescriptor | null,
            _accountDescriptor: AccountDescriptor,
            networkSymbol: NetworkSymbol,
        ) => networkSymbol,
    ],
    (accountLabels, accountDescriptor, networkSymbol) =>
        findSuiteSyncAccountLabel({ accounts: accountLabels, accountDescriptor, networkSymbol })
            ?.label ?? null,
);
