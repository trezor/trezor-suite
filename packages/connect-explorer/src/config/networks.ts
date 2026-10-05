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
    readonly route: string | null;
    readonly icons: NetworkAssetsModule;
};

export const connectExplorerNetworkConfig: readonly ExplorerNetworkConfig[] = [
    { symbol: asNetworkSymbol('btc'), name: 'Bitcoin', route: 'bitcoin', icons: bitcoinAssets },
    { symbol: asNetworkSymbol('test'), name: 'Bitcoin Testnet', route: null, icons: bitcoinAssets },
    { symbol: asNetworkSymbol('bch'), name: 'Bitcoin Cash', route: null, icons: bitcoinAssets },
    { symbol: asNetworkSymbol('ltc'), name: 'Litecoin', route: 'litecoin', icons: bitcoinAssets },
    { symbol: asNetworkSymbol('zec'), name: 'Zcash', route: null, icons: bitcoinAssets },
    { symbol: asNetworkSymbol('doge'), name: 'Dogecoin', route: null, icons: bitcoinAssets },
    { symbol: asNetworkSymbol('eth'), name: 'Ethereum', route: 'ethereum', icons: ethereumAssets },
    { symbol: asNetworkSymbol('xrp'), name: 'Ripple', route: 'ripple', icons: rippleAssets },
    { symbol: asNetworkSymbol('xlm'), name: 'Stellar', route: 'stellar', icons: stellarAssets },
    { symbol: asNetworkSymbol('ada'), name: 'Cardano', route: 'cardano', icons: cardanoAssets },
    { symbol: asNetworkSymbol('sol'), name: 'Solana', route: 'solana', icons: solanaAssets },
    { symbol: asNetworkSymbol('xtz'), name: 'Tezos', route: 'tezos', icons: tezosAssets },
    { symbol: asNetworkSymbol('trx'), name: 'Tron', route: 'tron', icons: tronAssets },
    { symbol: asNetworkSymbol('xmr'), name: 'Monero', route: 'monero', icons: moneroAssets },
];
