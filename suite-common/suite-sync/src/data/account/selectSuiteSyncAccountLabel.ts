import { type MessageSystemRootState } from '@suite-common/message-system';
import { createWeakMapSelector } from '@suite-common/redux-utils';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, WalletDescriptor } from '@suite-common/wallet-types';

import { type SuiteSyncDataRootState } from '../suiteSyncDataReducer';
import { findSuiteSyncAccountLabel } from './findSuiteSyncAccountLabel';
import {
    type WithSuiteSyncAndDeviceState,
    selectIsSuiteSyncEnabled,
} from '../../suiteSyncSelectors';
import { selectAllAccountsForWallet } from '../wallet/suiteSyncWalletSelectors';

type SuiteSyncAccountLabelRootState = SuiteSyncDataRootState &
    WithSuiteSyncAndDeviceState &
    MessageSystemRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<SuiteSyncAccountLabelRootState>();

export const selectSuiteSyncAccountLabel = createMemoizedSelector(
    [
        (state: SuiteSyncAccountLabelRootState, walletDescriptor: WalletDescriptor | null) =>
            selectAllAccountsForWallet(state, walletDescriptor),
        (
            _state: SuiteSyncAccountLabelRootState,
            _walletDescriptor: WalletDescriptor | null,
            accountDescriptor: AccountDescriptor,
        ) => accountDescriptor,
        (
            _state: SuiteSyncAccountLabelRootState,
            _walletDescriptor: WalletDescriptor | null,
            _accountDescriptor: AccountDescriptor,
            networkSymbol: NetworkSymbol,
        ) => networkSymbol,
        selectIsSuiteSyncEnabled,
    ],
    (accountLabels, accountDescriptor, networkSymbol, isSuiteSyncEnabled) => {
        if (!isSuiteSyncEnabled) return null;

        return (
            findSuiteSyncAccountLabel({ accounts: accountLabels, accountDescriptor, networkSymbol })
                ?.label ?? null
        );
    },
);
