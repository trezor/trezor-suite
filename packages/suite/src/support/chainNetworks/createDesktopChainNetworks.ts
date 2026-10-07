import type { GetNetworkConfigDep } from '@suite-common/networks';
import {
    type BitcoinBlockbookChainNetworkDeps,
    type BitcoinElectrumChainNetworkDeps,
    createBitcoinBlockbookChainNetwork,
    createBitcoinElectrumChainNetwork,
} from '@trezor/network-bitcoin-suite-common';
import {
    type CardanoChainNetworkDeps,
    createCardanoChainNetwork,
} from '@trezor/network-cardano-suite-common';
import {
    type EthereumBlockbookChainNetworkDeps,
    type EthereumCustomRpcChainNetworkDeps,
    createEthereumBlockbookChainNetwork,
    createEthereumCustomRpcChainNetwork,
} from '@trezor/network-ethereum-suite-common';
import type { ChainNetwork, ChainNetworkParams } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import {
    type RippleChainNetworkDeps,
    createRippleChainNetwork,
} from '@trezor/network-ripple-suite-common';
import {
    type SolanaChainNetworkDeps,
    createSolanaChainNetwork,
} from '@trezor/network-solana-suite-common';
import {
    type StellarChainNetworkDeps,
    createStellarChainNetwork,
} from '@trezor/network-stellar-suite-common';
import {
    type TronChainNetworkDeps,
    createTronChainNetwork,
} from '@trezor/network-tron-suite-common';
import { exhaustive } from '@trezor/type-utils';

export type DesktopChainNetworksDeps = BitcoinBlockbookChainNetworkDeps &
    BitcoinElectrumChainNetworkDeps &
    EthereumBlockbookChainNetworkDeps &
    EthereumCustomRpcChainNetworkDeps &
    SolanaChainNetworkDeps &
    CardanoChainNetworkDeps &
    RippleChainNetworkDeps &
    StellarChainNetworkDeps &
    TronChainNetworkDeps &
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
 */
export const createDesktopChainNetworks = (
    deps: DesktopChainNetworksDeps,
): DesktopChainNetworks => {
    const createBitcoinBlockbook = createBitcoinBlockbookChainNetwork(deps);
    const createBitcoinElectrum = createBitcoinElectrumChainNetwork(deps);
    const createEthereumBlockbook = createEthereumBlockbookChainNetwork(deps);
    const createEthereumCustomRpc = createEthereumCustomRpcChainNetwork(deps);
    const createSolana = createSolanaChainNetwork(deps);
    const createCardano = createCardanoChainNetwork(deps);
    const createRipple = createRippleChainNetwork(deps);
    const createStellar = createStellarChainNetwork(deps);
    const createTron = createTronChainNetwork(deps);

    const create = (params: ChainNetworkParams): ChainNetwork => {
        const { networkType } = deps.getNetworkConfig(params.symbol);

        switch (networkType) {
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
            case 'cardano':
                return createCardano(params);
            case 'ripple':
                return createRipple(params);
            case 'stellar':
                return createStellar(params);
            case 'tron':
                return createTron(params);
            default:
                return exhaustive(networkType);
        }
    };

    // One instance per symbol: a network is rebuilt only when its backend settings change, so
    // consumers holding it (and the queries keyed by it) are not churned by unrelated updates.
    const instances = new Map<NetworkSymbol, { key: string; network: ChainNetwork }>();

    return selection => {
        const selectedSymbols = new Set(selection.map(params => params.symbol));
        [...instances.keys()]
            .filter(symbol => !selectedSymbols.has(symbol))
            .forEach(symbol => instances.delete(symbol));

        return selection.map(params => {
            const key = getInstanceKey(params);
            const cached = instances.get(params.symbol);

            if (cached?.key === key) return cached.network;

            const network = create(params);
            instances.set(params.symbol, { key, network });

            return network;
        });
    };
};
