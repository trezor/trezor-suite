import { type NetworksRootState } from '@suite-common/networks';
import { type WithSuiteSyncState, selectSuiteSyncCustomRelayUrl } from '@suite-common/suite-sync';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type BlockchainRootState,
    type WalletSettingsRootState,
    blockchainInitialState,
    selectAccounts,
    selectBlockchainState,
    selectCustomBackends,
    selectEnabledNetworks,
    selectNetworkBlockchainInfo,
} from '@suite-common/wallet-core';
import { isTrezorConnectBackendType } from '@suite-common/wallet-utils';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@trezor/redux-utils';

// every network, enabled or not: a disabled one would reconnect to its custom backend once enabled again
// regtest ships with a custom backend of its own, which is its default
export const selectResettableCustomBackendSymbols = (
    state: BlockchainRootState & NetworksRootState,
) =>
    selectCustomBackends(state)
        .map(({ symbol }) => symbol)
        .filter(
            symbol =>
                blockchainInitialState[symbol as keyof typeof blockchainInitialState].backends
                    .selected === undefined,
        );

export const selectHasCustomServers = (
    state: BlockchainRootState & NetworksRootState & WithSuiteSyncState,
) =>
    selectResettableCustomBackendSymbols(state).length > 0 ||
    selectSuiteSyncCustomRelayUrl(state) !== null;

export type BackendConnectionStatus = 'connected' | 'connecting' | 'failed';

export type NetworkBackend = {
    symbol: NetworkSymbol;
    customUrls: string[];
    isCustom: boolean;
    status: BackendConnectionStatus;
};

const getConnectionStatus = ({
    connected,
    error,
}: {
    connected: boolean;
    error?: string;
}): BackendConnectionStatus => {
    if (connected) return 'connected';

    return error ? 'failed' : 'connecting';
};

const createMemoizedSelector = createWeakMapSelector.withTypes<
    AccountsRootState & BlockchainRootState & WalletSettingsRootState
>();

/**
 * Backends that Suite keeps connected: those of enabled networks with an account synced through Trezor Connect.
 * Other backends are connected only on demand and drop the connection when idle, which reads as an error.
 */
export const selectNetworkBackends = createMemoizedSelector(
    [selectAccounts, selectEnabledNetworks, selectBlockchainState],
    (accounts, enabledNetworks, blockchainState): NetworkBackend[] =>
        returnStableArrayIfEmpty(
            enabledNetworks
                .filter(symbol =>
                    accounts.some(
                        account =>
                            account.symbol === symbol &&
                            isTrezorConnectBackendType(account.backendType),
                    ),
                )
                .map(symbol => {
                    const blockchain = selectNetworkBlockchainInfo(
                        { wallet: { blockchain: blockchainState } },
                        symbol,
                    );
                    const { selected, urls } = blockchain.backends;

                    return {
                        symbol,
                        customUrls: selected ? (urls?.[selected] ?? []) : [],
                        isCustom: selected !== undefined,
                        status: getConnectionStatus(blockchain),
                    };
                }),
        ),
);

// a backend that is still connecting is not reported: it may be slow, e.g. behind Tor
const isUnreachableCustomBackend = ({ isCustom, status }: NetworkBackend) =>
    isCustom && status === 'failed';

export const selectHasConnectedNetworkBackend = (
    state: AccountsRootState & BlockchainRootState & WalletSettingsRootState,
) => selectNetworkBackends(state).some(({ status }) => status === 'connected');

export const selectUnreachableCustomBackendSymbol = (
    state: AccountsRootState & BlockchainRootState & WalletSettingsRootState,
) => selectNetworkBackends(state).find(isUnreachableCustomBackend)?.symbol;
