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
};

const getTrezorConnect = jest.fn();
const fetchCoinGeckoCurrentRate = jest.fn();
const fetchBlockbookHttpCurrentRate = jest.fn();

const deps: DesktopChainNetworksDeps = {
    getTrezorConnect,
    fetchCoinGeckoCurrentRate,
    fetchBlockbookHttpCurrentRate,
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

    it('builds one network per selected and migrated network', () => {
        const createChainNetworks = createDesktopChainNetworks(deps);

        const networks = createChainNetworks([
            select('btc', 'blockbook'),
            select('eth', 'blockbook'),
            select('base', 'blockbook'),
            select('sol', 'solana'),
            select('ada', 'blockfrost'),
        ]);

        expect(networks.map(({ symbol, backendType }) => [symbol, backendType])).toEqual([
            ['btc', 'blockbook'],
            ['eth', 'blockbook'],
            ['base', 'blockbook'],
            ['sol', 'solana'],
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
