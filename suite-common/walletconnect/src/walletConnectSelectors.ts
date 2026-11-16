import { type DeviceRootState } from '@suite-common/device';
import { type NetworksRootState } from '@suite-common/networks';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    selectAllSuccessfulAccountsToList,
} from '@suite-common/wallet-core';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { processNamespaces } from './adapters';
import { type WalletConnectStateRootState, selectPendingProposal } from './walletConnectReducer';
import { type PendingConnectionProposalNetwork } from './walletConnectTypes';

type PendingProposalNetworksRootState = WalletConnectStateRootState &
    AccountsRootState &
    DeviceRootState &
    WalletSettingsRootState &
    NetworksRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<PendingProposalNetworksRootState>();

// A proposal can arrive before discovery finishes, so network statuses follow the current accounts
// instead of the ones known when the proposal arrived.
export const selectPendingProposalNetworks = createMemoizedSelector(
    [selectPendingProposal, selectAllSuccessfulAccountsToList],
    (pendingProposal, accounts) => {
        const networks: PendingConnectionProposalNetwork[] = [];
        if (!pendingProposal) return networks;

        processNamespaces(accounts, networks, pendingProposal.params.requiredNamespaces, true);
        processNamespaces(accounts, networks, pendingProposal.params.optionalNamespaces, false);

        return networks;
    },
);
