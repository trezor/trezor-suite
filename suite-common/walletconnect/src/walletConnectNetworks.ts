import type { ProposalTypes } from '@walletconnect/types';

import type { NetworkModuleRepository, NetworkSymbol } from '@suite-common/networks';
import { type Account } from '@suite-common/wallet-types';
import { getAccountIdentity } from '@suite-common/wallet-utils';
import type {
    WalletConnectAccount,
    WalletConnectAdapter,
} from '@trezor/network-module-suite-common-types';

import {
    type PendingConnectionProposalNetwork,
    type WalletConnectNamespace,
} from './walletConnectTypes';

type WalletConnectModule = {
    adapter: WalletConnectAdapter<NetworkSymbol>;
    symbols: readonly NetworkSymbol[];
};

export const toWalletConnectAccount = (account: Account): WalletConnectAccount<NetworkSymbol> => ({
    symbol: account.symbol,
    descriptor: account.descriptor,
    path: account.path,
    visible: account.visible,
    addresses: account.addresses,
    utxo: account.utxo,
    unlockPath: account.unlockPath,
    identity: getAccountIdentity(account),
});

// One module serves several networks, so the adapters are grouped with the symbols they serve.
const getWalletConnectModules = (
    networkModuleRepository: NetworkModuleRepository,
): WalletConnectModule[] => {
    const symbolsByAdapter = new Map<WalletConnectAdapter<NetworkSymbol>, NetworkSymbol[]>();

    networkModuleRepository.getSupportedNetworks().forEach(symbol => {
        const adapter = networkModuleRepository.get(symbol).walletConnectAdapter;
        if (!adapter) return;

        symbolsByAdapter.set(adapter, [...(symbolsByAdapter.get(adapter) ?? []), symbol]);
    });

    return Array.from(symbolsByAdapter, ([adapter, symbols]) => ({ adapter, symbols }));
};

type GetNamespacesParams = {
    accounts: Account[];
    networkModuleRepository: NetworkModuleRepository;
};

/** Namespaces with the visible accounts that Suite can offer to a dApp. */
export const getNamespaces = ({
    accounts,
    networkModuleRepository,
}: GetNamespacesParams): Record<string, WalletConnectNamespace> => {
    const uniqueAccounts = accounts.filter(
        (account, index) =>
            accounts.findIndex(
                a => a.descriptor === account.descriptor && a.symbol === account.symbol,
            ) === index,
    );

    return Object.fromEntries(
        getWalletConnectModules(networkModuleRepository).flatMap(({ adapter, symbols }) => {
            const namespace: WalletConnectNamespace = {
                chains: [],
                accounts: [],
                methods: [...adapter.methods],
                events: [...adapter.events],
            };

            uniqueAccounts.forEach(account => {
                if (!account.visible || !symbols.includes(account.symbol)) return;

                const address = adapter.getAccountAddress(toWalletConnectAccount(account));
                if (!address) return;

                adapter.getChainIds(account.symbol).forEach(chainId => {
                    const accountId = `${chainId}:${address}`;
                    if (!namespace.chains.includes(chainId)) namespace.chains.push(chainId);
                    if (!namespace.accounts.includes(accountId)) namespace.accounts.push(accountId);
                });
            });

            return namespace.chains.length > 0 ? [[adapter.namespaceId, namespace] as const] : [];
        }),
    );
};

type GetProposalNetworksParams = {
    accounts: Account[];
    networkModuleRepository: NetworkModuleRepository;
    proposal: Pick<ProposalTypes.Struct, 'requiredNamespaces'> &
        Partial<Pick<ProposalTypes.Struct, 'optionalNamespaces'>>;
};

/** Networks that a dApp requests, each with the support that Suite has for it. */
export const getProposalNetworks = ({
    accounts,
    networkModuleRepository,
    proposal,
}: GetProposalNetworksParams): PendingConnectionProposalNetwork[] => {
    const walletConnectModules = getWalletConnectModules(networkModuleRepository);
    const networks: PendingConnectionProposalNetwork[] = [];

    const getStatus = (symbol: NetworkSymbol | undefined) => {
        if (!symbol) return 'unsupported';
        if (accounts.some(account => account.symbol === symbol)) return 'active';

        return 'inactive';
    };

    const addNetworks = (namespaces: ProposalTypes.RequiredNamespaces, required: boolean) =>
        Object.entries(namespaces).forEach(([namespaceId, namespace]) => {
            const walletConnectModule = walletConnectModules.find(
                ({ adapter }) => adapter.namespaceId === namespaceId,
            );
            if (!walletConnectModule) return;

            namespace.chains?.forEach(chain => {
                const symbol = walletConnectModule.symbols.find(s =>
                    walletConnectModule.adapter.getChainIds(s).includes(chain),
                );
                // A network may have more chain IDs, list it once.
                const isAdded = networks.some(network =>
                    symbol ? network.symbol === symbol : network.namespaceId === chain,
                );
                if (isAdded) return;

                networks.push({
                    namespaceId: chain,
                    symbol,
                    name: symbol
                        ? networkModuleRepository.get(symbol).getNetworkConfig(symbol).name
                        : `Unknown (${chain})`,
                    status: getStatus(symbol),
                    required,
                });
            });
        });

    addNetworks(proposal.requiredNamespaces, true);
    addNetworks(proposal.optionalNamespaces ?? {}, false);

    return networks;
};

type GetWalletConnectAdapterByMethodParams = {
    method: string;
    networkModuleRepository: NetworkModuleRepository;
};

export const getWalletConnectAdapterByMethod = ({
    method,
    networkModuleRepository,
}: GetWalletConnectAdapterByMethodParams) =>
    getWalletConnectModules(networkModuleRepository).find(({ adapter }) =>
        adapter.methods.includes(method),
    )?.adapter;

type GetWalletConnectNamespaceIdParams = {
    symbol: NetworkSymbol;
    networkModuleRepository: NetworkModuleRepository;
};

export const getWalletConnectNamespaceId = ({
    symbol,
    networkModuleRepository,
}: GetWalletConnectNamespaceIdParams) =>
    networkModuleRepository.isSupportedNetwork(symbol)
        ? networkModuleRepository.get(symbol).walletConnectAdapter?.namespaceId
        : undefined;
