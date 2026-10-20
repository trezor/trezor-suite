import { type CoinSymbol, asCoinSymbol } from '@trezor/connect-common/src/types/coinInfo';
import { toHardenedPathPart } from '@trezor/crypto-utils';

import {
    getAllNetworks,
    getBitcoinNetworkOrThrow,
    getCoinInfoOrThrow,
    getEthereumNetwork,
    getMiscNetwork,
    getUniqueNetworks,
    registerEthereumNetwork,
} from './coinInfo';

describe('data/coinInfo', () => {
    it('resolves a coin string by shortcut only (network name / label no longer accepted)', () => {
        // the lowercase shortcut resolves, case-insensitively, across all families
        expect(getCoinInfoOrThrow('btc').shortcut).toBe('BTC');
        expect(getCoinInfoOrThrow('BTC').shortcut).toBe('BTC');
        expect(getCoinInfoOrThrow('ada').shortcut).toBe('ADA');
        expect(getCoinInfoOrThrow('eth').shortcut).toBe('ETH');
        expect(getCoinInfoOrThrow('rhc')).toMatchObject({
            shortcut: 'RHC',
            chainId: 4663,
            slip44: 60,
        });
        expect(getCoinInfoOrThrow('hype')).toMatchObject({
            shortcut: 'HYPE',
            chainId: 999,
            slip44: 60,
        });

        // the network name and label forms are no longer accepted (D2/D3)
        expect(() => getCoinInfoOrThrow('bitcoin')).toThrow('Coin not found');
        expect(() => getCoinInfoOrThrow('Bitcoin Cash')).toThrow('Coin not found');
        expect(() => getCoinInfoOrThrow('cardano')).toThrow('Coin not found');
    });

    it('getBitcoinNetworkOrThrow resolves bitcoin networks and rejects everything else', () => {
        // resolves a bitcoin-family shortcut
        expect(getBitcoinNetworkOrThrow('btc').shortcut).toBe('BTC');
        expect(getBitcoinNetworkOrThrow('ltc').shortcut).toBe('LTC');

        // resolves by BIP32 path via slip44 ([44', 0'] -> slip44 0 -> BTC)
        expect(
            getBitcoinNetworkOrThrow([toHardenedPathPart(44), toHardenedPathPart(0)]).shortcut,
        ).toBe('BTC');

        // eth/misc symbols resolve via getCoinInfoOrThrow but are rejected here (bitcoin-only guard)
        expect(() => getBitcoinNetworkOrThrow('eth')).toThrow('Coin not found');
        expect(() => getBitcoinNetworkOrThrow('ada')).toThrow('Coin not found');
    });

    it('uses the production Robinhood Blockbook', () => {
        expect(getCoinInfoOrThrow('rhc').blockchainLink).toEqual({
            type: 'blockbook',
            url: ['https://rhc.trezor.io'],
        });
    });

    it('uses the HyperEVM Blockbook backend', () => {
        expect(getCoinInfoOrThrow('hype').blockchainLink).toEqual({
            type: 'blockbook',
            url: ['https://hype.trezor.io'],
        });
    });

    it('serves Arc testnet over the RPC worker, with no blockbook involved', () => {
        // First network whose default backend is not blockbook. The coin-data parser copies
        // blockchain_link through untouched, and Blockchain.getWorker() dispatches on that type,
        // so a typo here silently becomes Backend_NotSupported at runtime.
        expect(getCoinInfoOrThrow('tarc')).toMatchObject({
            shortcut: 'tARC',
            chainId: 5042002,
            slip44: 60,
            decimals: 18,
            blockchainLink: {
                type: 'evm-rpc',
                url: ['https://rpc.testnet.arc.network'],
            },
        });
    });

    it('every evm network uses slip44 60, except ETC (61)', () => {
        // Suite derives all EVM accounts at m/44'/60' (ETC at m/44'/61'), and slip44 drives the
        // default discovery path in connect popup — a per-chain registry value (as ethereum-lists
        // has for e.g. BSC or Optimism) would discover accounts Suite never shows.
        getAllNetworks()
            .filter(network => network.type === 'ethereum')
            .forEach(network => {
                expect({ shortcut: network.shortcut, slip44: network.slip44 }).toEqual({
                    shortcut: network.shortcut,
                    slip44: network.shortcut === 'ETC' ? 61 : 60,
                });
            });
    });

    it('resolves every misc firmware-gating shortcut (requiredFirmwareCoins is never [undefined])', () => {
        // the shortcut forms the misc api methods pass to getMiscNetwork() to build
        // requiredFirmwareCoins — a wrong form would silently become [undefined] (D1)
        const shortcuts: CoinSymbol[] = ['ada', 'xrp', 'xmr', 'trx', 'xlm', 'sol', 'xtz', 'nostr'];
        shortcuts.forEach(shortcut => {
            expect(getMiscNetwork(shortcut)).toBeDefined();
        });
    });

    it('no coin name or label collides with a different coin shortcut', () => {
        // guards against a coins.json regeneration reintroducing a name/label that shadows
        // another coin's shortcut. Only the bitcoin (name + label) and misc (name) resolvers ever
        // matched these forms; the ethereum resolver was always shortcut-only, so an EVM coin's
        // label (the shared native-currency symbol, e.g. 'ETH') was never a resolution key.
        const networks = getAllNetworks();
        const shortcutOwner = new Map(networks.map(n => [n.shortcut.toLowerCase(), n.shortcut]));
        networks.forEach(n => {
            if (n.type === 'ethereum') return;
            const forms = n.type === 'bitcoin' ? [n.name, n.label] : [n.name];
            forms.forEach(form => {
                const ownerShortcut = shortcutOwner.get(form.toLowerCase());
                // a coin's own name/label may equal its own shortcut, but never a different coin's
                expect(ownerShortcut === undefined || ownerShortcut === n.shortcut).toBe(true);
            });
        });
    });

    it('getUniqueNetworks', () => {
        const inputs = [
            getCoinInfoOrThrow('btc'),
            getCoinInfoOrThrow('ltc'),
            getCoinInfoOrThrow('btc'),
            getCoinInfoOrThrow('ltc'),
            getCoinInfoOrThrow('ltc'),
        ];
        const result = [getCoinInfoOrThrow('btc'), getCoinInfoOrThrow('ltc')];
        expect(getUniqueNetworks(inputs)).toEqual(result);
    });

    it('bitcoin network blocktime', () => {
        const bitcoinNetworks = getAllNetworks().filter(({ type }) => type === 'bitcoin');
        bitcoinNetworks.forEach(network => {
            expect(network.blockTime).toBeGreaterThan(0);
        });
    });
});

describe('data/coinInfo registerEthereumNetwork', () => {
    const sonic = {
        symbol: 'evm146',
        name: 'Sonic',
        chainId: 146,
        rpcUrls: ['https://rpc.soniclabs.com'],
    };

    it('registers an EVM network that resolves like a bundled one', () => {
        registerEthereumNetwork(sonic);

        const expected = {
            type: 'ethereum',
            shortcut: 'evm146',
            name: 'Sonic',
            label: 'Sonic',
            chainId: 146,
            slip44: 60,
            decimals: 18,
            blockchainLink: { type: 'evm-rpc', url: ['https://rpc.soniclabs.com'] },
        };
        expect(getCoinInfoOrThrow('evm146')).toMatchObject(expected);
        expect(getCoinInfoOrThrow('EVM146')).toMatchObject(expected);
        expect(getEthereumNetwork(asCoinSymbol('evm146'))).toMatchObject(expected);
        expect(getAllNetworks().filter(({ shortcut }) => shortcut === 'evm146')).toHaveLength(1);
    });

    it('does not shadow the bundled Ethereum when looking up by path', () => {
        registerEthereumNetwork({ ...sonic, symbol: 'evm147', chainId: 147 });

        expect(getEthereumNetwork([toHardenedPathPart(44), toHardenedPathPart(60)])?.shortcut).toBe(
            'ETH',
        );
    });

    it('gives the network fee levels and the support matrix of Ethereum', () => {
        registerEthereumNetwork({ ...sonic, symbol: 'evm148', chainId: 148 });

        const ethereum = getCoinInfoOrThrow('eth');
        const network = getCoinInfoOrThrow('evm148');

        expect(Object.keys(ethereum.support).length).toBeGreaterThan(0);
        expect(network.support).toEqual(ethereum.support);
        expect(network.defaultFees).toHaveLength(1);
        expect(network.defaultFees[0]).toMatchObject({ label: 'normal', feeLimit: '21000' });
        expect(network.minFee).toBeGreaterThan(0);
        expect(network.maxFee).toBeGreaterThan(network.minFee);
        expect(network.blockTime).toBeGreaterThan(0);
    });

    it('updates a network registered before instead of duplicating it', () => {
        registerEthereumNetwork({ ...sonic, symbol: 'evm149', chainId: 149 });
        registerEthereumNetwork({
            ...sonic,
            symbol: 'evm149',
            chainId: 149,
            name: 'Sonic 2',
            rpcUrls: ['https://rpc2.example.com', 'wss://rpc2.example.com'],
        });

        expect(getCoinInfoOrThrow('evm149')).toMatchObject({
            name: 'Sonic 2',
            blockchainLink: {
                type: 'evm-rpc',
                url: ['https://rpc2.example.com', 'wss://rpc2.example.com'],
            },
        });
        expect(getAllNetworks().filter(({ shortcut }) => shortcut === 'evm149')).toHaveLength(1);
    });

    it('keeps the support of Ethereum independent of the registered network', () => {
        const network = registerEthereumNetwork({ ...sonic, symbol: 'evm150', chainId: 150 });

        expect(network.support).not.toBe(getCoinInfoOrThrow('eth').support);
    });

    it.each(['eth', 'ETH', 'btc', 'ada', 'tarc'])(
        'rejects the symbol %s of a bundled network',
        symbol => {
            expect(() => registerEthereumNetwork({ ...sonic, symbol, chainId: 151 })).toThrow(
                'already used by a bundled network',
            );
        },
    );

    it('rejects the chain id of a bundled network and leaves it untouched', () => {
        // 5042 is Arc
        expect(() =>
            registerEthereumNetwork({ ...sonic, symbol: 'evm5042', chainId: 5042 }),
        ).toThrow('Chain ID 5042 is already used by a bundled network');
        expect(() => getCoinInfoOrThrow('evm5042')).toThrow('Coin not found');
        expect(getCoinInfoOrThrow('arc')).toMatchObject({ shortcut: 'ARC', chainId: 5042 });
    });

    it('rejects the update of a bundled network and leaves it untouched', () => {
        expect(() =>
            registerEthereumNetwork({
                ...sonic,
                symbol: 'arc',
                chainId: 152,
                rpcUrls: ['https://x'],
            }),
        ).toThrow('already used by a bundled network');
        expect(getCoinInfoOrThrow('arc').blockchainLink).toEqual({
            type: 'evm-rpc',
            url: ['https://arc.trezor.io'],
        });
    });
});
