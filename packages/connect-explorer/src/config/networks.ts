import { type NetworkRoute, asNetworkRoute } from '@trezor/connect-explorer-theme';
import type { NetworkAssetsModule } from '@trezor/network-assets-types';
import { bitcoinAssets } from '@trezor/network-bitcoin-assets';
import { cardanoAssets } from '@trezor/network-cardano-assets';
import { ethereumAssets } from '@trezor/network-ethereum-assets';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';
import { moneroAssets } from '@trezor/network-monero-assets';
import { rippleAssets } from '@trezor/network-ripple-assets';
import { solanaAssets } from '@trezor/network-solana-assets';
import { stellarAssets } from '@trezor/network-stellar-assets';
import { tezosAssets } from '@trezor/network-tezos-assets';
import { tronAssets } from '@trezor/network-tron-assets';

export type ExplorerNetworkConfig = {
    readonly symbol: NetworkSymbol;
    readonly name: string;
    readonly testnet?: boolean;
    readonly route: NetworkRoute | null;
    readonly icons: NetworkAssetsModule;
};

export const connectExplorerNetworkConfig: readonly ExplorerNetworkConfig[] = [
    {
        symbol: asNetworkSymbol('btc'),
        name: 'Bitcoin',
        route: asNetworkRoute('bitcoin'),
        icons: bitcoinAssets,
    },
    {
        symbol: asNetworkSymbol('test'),
        testnet: true,
        name: 'Bitcoin Testnet',
        route: null,
        icons: bitcoinAssets,
    },
    { symbol: asNetworkSymbol('bch'), name: 'Bitcoin Cash', route: null, icons: bitcoinAssets },
    {
        symbol: asNetworkSymbol('ltc'),
        name: 'Litecoin',
        route: asNetworkRoute('litecoin'),
        icons: bitcoinAssets,
    },
    { symbol: asNetworkSymbol('zec'), name: 'Zcash', route: null, icons: bitcoinAssets },
    { symbol: asNetworkSymbol('doge'), name: 'Dogecoin', route: null, icons: bitcoinAssets },
    {
        symbol: asNetworkSymbol('eth'),
        name: 'Ethereum',
        route: asNetworkRoute('ethereum'),
        icons: ethereumAssets,
    },
    {
        symbol: asNetworkSymbol('xrp'),
        name: 'Ripple',
        route: asNetworkRoute('ripple'),
        icons: rippleAssets,
    },
    {
        symbol: asNetworkSymbol('xlm'),
        name: 'Stellar',
        route: asNetworkRoute('stellar'),
        icons: stellarAssets,
    },
    {
        symbol: asNetworkSymbol('ada'),
        name: 'Cardano',
        route: asNetworkRoute('cardano'),
        icons: cardanoAssets,
    },
    {
        symbol: asNetworkSymbol('sol'),
        name: 'Solana',
        route: asNetworkRoute('solana'),
        icons: solanaAssets,
    },
    {
        symbol: asNetworkSymbol('xtz'),
        name: 'Tezos',
        route: asNetworkRoute('tezos'),
        icons: tezosAssets,
    },
    {
        symbol: asNetworkSymbol('trx'),
        name: 'Tron',
        route: asNetworkRoute('tron'),
        icons: tronAssets,
    },
    {
        symbol: asNetworkSymbol('xmr'),
        name: 'Monero',
        route: asNetworkRoute('monero'),
        icons: moneroAssets,
    },
];
