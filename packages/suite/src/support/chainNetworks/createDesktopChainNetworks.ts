import type { GetNetworkConfigDep } from '@suite-common/networks';
import {
    type BitcoinBlockbookChainNetworkDeps,
    type BitcoinElectrumChainNetworkDeps,
    createBitcoinBlockbookChainNetwork,
    createBitcoinElectrumChainNetwork,
} from '@trezor/network-bitcoin-suite-common';
import {
    type EthereumBlockbookChainNetworkDeps,
    type EthereumCustomRpcChainNetworkDeps,
    createEthereumBlockbookChainNetwork,
    createEthereumCustomRpcChainNetwork,
} from '@trezor/network-ethereum-suite-common';
import type { ChainNetwork, ChainNetworkParams } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import {
    type SolanaChainNetworkDeps,
    createSolanaChainNetwork,
} from '@trezor/network-solana-suite-common';

export type DesktopChainNetworksDeps = BitcoinBlockbookChainNetworkDeps &
    BitcoinElectrumChainNetworkDeps &
    EthereumBlockbookChainNetworkDeps &
    EthereumCustomRpcChainNetworkDeps &
    SolanaChainNetworkDeps &
    GetNetworkConfigDep;

/** Builds the chain networks for a selection, keeping each one while its selection is unchanged. */
export type DesktopChainNetworks = (
    selection: readonly ChainNetworkParams[],
) => readonly ChainNetwork[];

const getInstanceKey = (params: ChainNetworkParams) =>
    JSON.stringify([params.backend.type, params.backend.urls, params.gapLimit ?? null]);

/**
 * The desktop composition of chain networks: the one place that knows which implementation serves
 * a network family on a given backend. Everything past it works with `ChainNetwork` only.
 *
 * Families not migrated yet build no network; their accounts stay on the Redux path.
 */
export const createDesktopChainNetworks = (
    deps: DesktopChainNetworksDeps,
): DesktopChainNetworks => {
    const createBitcoinBlockbook = createBitcoinBlockbookChainNetwork(deps);
    const createBitcoinElectrum = createBitcoinElectrumChainNetwork(deps);
    const createEthereumBlockbook = createEthereumBlockbookChainNetwork(deps);
    const createEthereumCustomRpc = createEthereumCustomRpcChainNetwork(deps);
    const createSolana = createSolanaChainNetwork(deps);

    const create = (params: ChainNetworkParams): ChainNetwork | null => {
        switch (deps.getNetworkConfig(params.symbol).networkType) {
            case 'bitcoin':
                return params.backend.type === 'electrum'
                    ? createBitcoinElectrum(params)
                    : createBitcoinBlockbook(params);
            case 'ethereum':
                return params.backend.type === 'evm-rpc'
                    ? createEthereumCustomRpc(params)
                    : createEthereumBlockbook(params);
            case 'solana':
                return createSolana(params);
            default:
                return null;
        }
    };

    // One instance per symbol: a network is rebuilt only when its backend settings change, so
    // consumers holding it (and the queries keyed by it) are not churned by unrelated updates.
    const instances = new Map<NetworkSymbol, { key: string; network: ChainNetwork | null }>();

    return selection => {
        const selectedSymbols = new Set(selection.map(params => params.symbol));
        [...instances.keys()]
            .filter(symbol => !selectedSymbols.has(symbol))
            .forEach(symbol => instances.delete(symbol));

        return selection.flatMap(params => {
            const key = getInstanceKey(params);
            const cached = instances.get(params.symbol);

            if (cached?.key === key) return cached.network ?? [];

            const network = create(params);
            instances.set(params.symbol, { key, network });

            return network ?? [];
        });
    };
};
