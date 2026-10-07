import { type NetworkType, asNetworkSymbol } from '@suite-common/wallet-config';
import type { ChainNetworkParams } from '@trezor/network-module-suite-common-types';

import {
    type DesktopChainNetworksDeps,
    createDesktopChainNetworks,
} from './createDesktopChainNetworks';

const NETWORK_TYPES: Partial<Record<string, NetworkType>> = {
    btc: 'bitcoin',
    eth: 'ethereum',
    base: 'ethereum',
    sol: 'solana',
    ada: 'cardano',
    xrp: 'ripple',
    xlm: 'stellar',
    trx: 'tron',
};

const getTrezorConnect = jest.fn();
const fetchCoinGeckoCurrentRate = jest.fn();
const fetchBlockbookHttpCurrentRate = jest.fn();
const fetchCoinGeckoHistoricRates = jest.fn();
const fetchBlockbookHttpHistoricRates = jest.fn();

const deps: DesktopChainNetworksDeps = {
    getTrezorConnect,
    fetchCoinGeckoCurrentRate,
    fetchBlockbookHttpCurrentRate,
    fetchCoinGeckoHistoricRates,
    fetchBlockbookHttpHistoricRates,
    getNetworkConfig: symbol =>
        ({ networkType: NETWORK_TYPES[symbol] }) as ReturnType<
            DesktopChainNetworksDeps['getNetworkConfig']
        >,
};

const select = (
    symbol: string,
    type: ChainNetworkParams['backend']['type'],
    urls: string[] = [],
): ChainNetworkParams => ({ symbol: asNetworkSymbol(symbol), backend: { type, urls } });

const { signal } = new AbortController();

describe('createDesktopChainNetworks', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('builds a network for every selected network of every family', () => {
        const createChainNetworks = createDesktopChainNetworks(deps);

        const networks = createChainNetworks([
            select('btc', 'blockbook'),
            select('eth', 'blockbook'),
            select('base', 'blockbook'),
            select('sol', 'solana'),
            select('ada', 'blockfrost'),
            select('xrp', 'ripple'),
            select('xlm', 'stellar'),
            select('trx', 'blockbook'),
        ]);

        expect(networks.map(({ symbol, backendType }) => [symbol, backendType])).toEqual([
            ['btc', 'blockbook'],
            ['eth', 'blockbook'],
            ['base', 'blockbook'],
            ['sol', 'solana'],
            ['ada', 'blockfrost'],
            ['xrp', 'ripple'],
            ['xlm', 'stellar'],
            ['trx', 'blockbook'],
        ]);
    });

    it('gives each family its own token capabilities', () => {
        const networks = createDesktopChainNetworks(deps)([
            select('btc', 'blockbook'),
            select('xrp', 'ripple'),
            select('ada', 'blockfrost'),
            select('xlm', 'stellar'),
            select('trx', 'blockbook'),
            select('sol', 'solana'),
            select('eth', 'blockbook'),
        ]);

        expect(networks.map(network => [network.symbol, !!network.getTokens])).toEqual([
            ['btc', false],
            ['xrp', false],
            ['ada', true],
            ['xlm', true],
            ['trx', true],
            ['sol', true],
            ['eth', true],
        ]);
    });

    it('reads history on every backend that keeps one', () => {
        const networks = createDesktopChainNetworks(deps)([
            select('btc', 'electrum', ['electrum.example:50001:s']),
            select('eth', 'evm-rpc', ['https://rpc.example']),
            select('base', 'blockbook'),
            select('sol', 'solana'),
            select('ada', 'blockfrost'),
            select('xrp', 'ripple'),
            select('xlm', 'stellar'),
            select('trx', 'blockbook'),
        ]);

        expect(networks.map(network => [network.symbol, !!network.getTransactions])).toEqual([
            ['btc', true],
            ['eth', false],
            ['base', true],
            ['sol', true],
            ['ada', true],
            ['xrp', true],
            ['xlm', true],
            ['trx', true],
        ]);
    });

    it('serves Bitcoin from Electrum when the user chose it', async () => {
        fetchBlockbookHttpCurrentRate.mockResolvedValue({ rate: 1, timestamp: 1 });
        const [network] = createDesktopChainNetworks(deps)([
            select('btc', 'electrum', ['electrum.example:50001:s']),
        ]);

        await network?.getNativeFiatRate({ currency: 'usd', signal });

        expect(network?.backendType).toBe('electrum');
        expect(fetchBlockbookHttpCurrentRate).toHaveBeenCalled();
    });

    it('serves an EVM network from a custom RPC node when the user chose it', async () => {
        fetchCoinGeckoCurrentRate.mockResolvedValue({ rate: 1, timestamp: 1 });
        const [network] = createDesktopChainNetworks(deps)([
            select('eth', 'evm-rpc', ['https://rpc.example']),
        ]);

        await network?.getNativeFiatRate({ currency: 'usd', signal });

        expect(network?.backendType).toBe('evm-rpc');
        expect(fetchCoinGeckoCurrentRate).toHaveBeenCalled();
        expect(getTrezorConnect).not.toHaveBeenCalled();
    });

    it('keeps a network while its selection is unchanged', () => {
        const createChainNetworks = createDesktopChainNetworks(deps);

        const [first] = createChainNetworks([select('btc', 'blockbook')]);
        const [second] = createChainNetworks([select('btc', 'blockbook')]);

        expect(second).toBe(first);
    });

    it('rebuilds a network when its backend changes', () => {
        const createChainNetworks = createDesktopChainNetworks(deps);

        const [first] = createChainNetworks([select('btc', 'electrum', ['a:50001:s'])]);
        const [second] = createChainNetworks([select('btc', 'electrum', ['b:50001:s'])]);

        expect(second).not.toBe(first);
    });

    it('forgets a network once it is deselected', () => {
        const createChainNetworks = createDesktopChainNetworks(deps);

        const [first] = createChainNetworks([select('btc', 'blockbook')]);
        createChainNetworks([]);
        const [second] = createChainNetworks([select('btc', 'blockbook')]);

        expect(second).not.toBe(first);
    });
});
