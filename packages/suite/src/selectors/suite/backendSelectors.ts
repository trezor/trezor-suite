import { type NetworksRootState } from '@suite-common/networks';
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
import { type Account, type Blockchain } from '@suite-common/wallet-types';
import { isTrezorConnectBackendType, tryGetAccountIdentity } from '@suite-common/wallet-utils';
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

export const selectHasCustomServers = (state: BlockchainRootState & NetworksRootState) =>
    selectResettableCustomBackendSymbols(state).length > 0;

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

export const selectConnectingBackends = createMemoizedSelector(
    [selectNetworkBackends],
    networkBackends =>
        returnStableArrayIfEmpty(networkBackends.filter(({ status }) => status === 'connecting')),
);

// a backend that is still connecting is not reported: it may be slow, e.g. behind Tor
const isUnreachableCustomBackend = ({ isCustom, status }: NetworkBackend) =>
    isCustom && status === 'failed';

export const selectHasConnectedNetworkBackend = (
    state: AccountsRootState & BlockchainRootState & WalletSettingsRootState,
) => selectNetworkBackends(state).some(({ status }) => status === 'connected');

// several unreachable custom backends point to the user's own network rather than to one of them
export const selectUnreachableCustomBackendSymbol = (
    state: AccountsRootState & BlockchainRootState & WalletSettingsRootState,
) => {
    const unreachableBackends = selectNetworkBackends(state).filter(isUnreachableCustomBackend);

    return unreachableBackends.length === 1 ? unreachableBackends[0]?.symbol : undefined;
};

export const selectIsCustomBackendUnreachable = (
    state: AccountsRootState & BlockchainRootState & WalletSettingsRootState,
    symbol: NetworkSymbol,
) =>
    selectNetworkBackends(state).some(
        backend => backend.symbol === symbol && isUnreachableCustomBackend(backend),
    );

// Ethereum accounts connect under their own identity, so their connection may fail on its own
export const selectIsAccountCustomBackendUnreachable = (
    state: BlockchainRootState,
    account: Pick<Account, 'symbol' | 'backendType' | 'networkType' | 'deviceState'>,
) => {
    if (!isTrezorConnectBackendType(account.backendType)) return false;

    const blockchain: Blockchain | undefined = selectNetworkBlockchainInfo(state, account.symbol);
    if (blockchain?.backends.selected === undefined) return false;

    const identity = tryGetAccountIdentity(account);
    const identityConnection = identity ? blockchain.identityConnections?.[identity] : undefined;

    return getConnectionStatus(identityConnection ?? blockchain) === 'failed';
};

export const selectCustomBackendsStatus = (
    state: AccountsRootState & BlockchainRootState & WalletSettingsRootState,
): BackendConnectionStatus => {
    const statuses = selectNetworkBackends(state)
        .filter(({ isCustom }) => isCustom)
        .map(({ status }) => status);

    if (statuses.includes('failed')) return 'failed';

    return statuses.includes('connecting') ? 'connecting' : 'connected';
};
