import type { CoinSymbol } from '@trezor/connect-common/src/types/coinInfo';

import { getAllNetworks, getCoinInfoOrThrow, getMiscNetwork, getUniqueNetworks } from './coinInfo';

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
