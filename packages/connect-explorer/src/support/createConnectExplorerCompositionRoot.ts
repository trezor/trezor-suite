import { createNetworkAssetsRegistry } from '@trezor/network-assets';
import { bitcoinAssets } from '@trezor/network-bitcoin-assets';
import { cardanoAssets } from '@trezor/network-cardano-assets';
import { ethereumAssets } from '@trezor/network-ethereum-assets';
import { moneroAssets } from '@trezor/network-monero-assets';
import { rippleAssets } from '@trezor/network-ripple-assets';
import { solanaAssets } from '@trezor/network-solana-assets';
import { stellarAssets } from '@trezor/network-stellar-assets';
import { tezosAssets } from '@trezor/network-tezos-assets';
import { tronAssets } from '@trezor/network-tron-assets';
import { typedObjectEntries, typedObjectValues } from '@trezor/utils';

import { type ConnectExplorerApp, createConnectExplorerApp } from './createConnectExplorerApp';
import { createConnectExplorerReduxStore } from '../store/createConnectExplorerReduxStore';

type ConnectExplorerCompositionRoot = { app: ConnectExplorerApp };

export const createConnectExplorerCompositionRoot = (): ConnectExplorerCompositionRoot => {
    const store = createConnectExplorerReduxStore();
    const networkAssetsModules = {
        bitcoin: bitcoinAssets,
        cardano: cardanoAssets,
        ethereum: ethereumAssets,
        monero: moneroAssets,
        ripple: rippleAssets,
        solana: solanaAssets,
        stellar: stellarAssets,
        tezos: tezosAssets,
        tron: tronAssets,
    };
    const networkAssetsRegistry = createNetworkAssetsRegistry({
        networkAssetsModules: typedObjectValues(networkAssetsModules),
    });
    // Explorer groups methods by route names (bitcoin, ethereum), while asset modules use
    // network symbols (btc, eth). Keep this route mapping separate from supported networks.
    const routeNetworkSymbols = {
        bitcoin: 'btc',
        cardano: 'ada',
        ethereum: 'eth',
        litecoin: 'ltc',
        monero: 'xmr',
        ripple: 'xrp',
        solana: 'sol',
        stellar: 'xlm',
        tezos: 'xtz',
        tron: 'trx',
    } satisfies Record<keyof typeof networkAssetsModules | 'litecoin', string>;
    const coinIcons: Record<string, string> = {};
    for (const [name, symbol] of typedObjectEntries(routeNetworkSymbols)) {
        const icons = networkAssetsRegistry.getIcons(symbol);
        if (typeof icons?.coin === 'string') coinIcons[name] = icons.coin;
    }

    return { app: createConnectExplorerApp({ services: { store, coinIcons } }) };
};
