import { getAllNetworks, getCoinInfo, getMiscNetwork, getUniqueNetworks } from '../coinInfo';

describe('data/coinInfo', () => {
    it('resolves a coin string by shortcut only (network name / label no longer accepted)', () => {
        // the lowercase shortcut resolves, case-insensitively, across all families
        expect(getCoinInfo('btc')?.shortcut).toBe('BTC');
        expect(getCoinInfo('BTC')?.shortcut).toBe('BTC');
        expect(getCoinInfo('ada')?.shortcut).toBe('ADA');
        expect(getCoinInfo('eth')?.shortcut).toBe('ETH');

        // the network name and label forms are no longer accepted (D2/D3)
        expect(getCoinInfo('bitcoin')).toBeUndefined();
        expect(getCoinInfo('Bitcoin Cash')).toBeUndefined();
        expect(getCoinInfo('cardano')).toBeUndefined();
    });

    it('resolves every misc firmware-gating shortcut (requiredFirmwareCoins is never [undefined])', () => {
        // the shortcut forms the misc api methods pass to getMiscNetwork() to build
        // requiredFirmwareCoins — a wrong form would silently become [undefined] (D1)
        ['ada', 'xrp', 'xmr', 'trx', 'xlm', 'sol', 'xtz', 'nostr'].forEach(shortcut => {
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
            getCoinInfo('btc'),
            getCoinInfo('ltc'),
            getCoinInfo('btc'),
            getCoinInfo('ltc'),
            getCoinInfo('ltc'),
        ];
        const result = [getCoinInfo('btc'), getCoinInfo('ltc')];
        expect(getUniqueNetworks(inputs)).toEqual(result);
    });

    it('bitcoin network blocktime', () => {
        const bitcoinNetworks = getAllNetworks().filter(({ type }) => type === 'bitcoin');
        bitcoinNetworks.forEach(network => {
            expect(network.blockTime).toBeGreaterThan(0);
        });
    });
});
