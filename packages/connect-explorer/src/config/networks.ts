import { type NetworkRoute, asNetworkRoute } from '@trezor/connect-explorer-theme';
import { type NetworkSymbol, asNetworkSymbol } from '@trezor/network-module-types';

export type ExplorerNetworkConfig = {
    readonly symbol: NetworkSymbol;
    readonly name: string;
    readonly route: NetworkRoute | null;
};

export const connectExplorerNetworkConfig: readonly ExplorerNetworkConfig[] = [
    { symbol: asNetworkSymbol('btc'), name: 'Bitcoin', route: asNetworkRoute('bitcoin') },
    { symbol: asNetworkSymbol('test'), name: 'Bitcoin Testnet', route: null },
    { symbol: asNetworkSymbol('bch'), name: 'Bitcoin Cash', route: null },
    { symbol: asNetworkSymbol('ltc'), name: 'Litecoin', route: asNetworkRoute('litecoin') },
    { symbol: asNetworkSymbol('zec'), name: 'Zcash', route: null },
    { symbol: asNetworkSymbol('doge'), name: 'Dogecoin', route: null },
    { symbol: asNetworkSymbol('eth'), name: 'Ethereum', route: asNetworkRoute('ethereum') },
    { symbol: asNetworkSymbol('xrp'), name: 'Ripple', route: asNetworkRoute('ripple') },
    { symbol: asNetworkSymbol('xlm'), name: 'Stellar', route: asNetworkRoute('stellar') },
    { symbol: asNetworkSymbol('ada'), name: 'Cardano', route: asNetworkRoute('cardano') },
    { symbol: asNetworkSymbol('sol'), name: 'Solana', route: asNetworkRoute('solana') },
    { symbol: asNetworkSymbol('xtz'), name: 'Tezos', route: asNetworkRoute('tezos') },
    { symbol: asNetworkSymbol('trx'), name: 'Tron', route: asNetworkRoute('tron') },
    { symbol: asNetworkSymbol('xmr'), name: 'Monero', route: asNetworkRoute('monero') },
];
