import { entryToValueBytes } from '../proof';

// entryToValueBytes is the only survivor of the legacy plaintext hashing layer: it no
// longer feeds any host-side trie (the device seals the leaf), but it still builds the
// plaintext `new_value` the device confirms on screen at queue time, so its determinism
// matters — an unstable key order would change what the user approved.
describe('entryToValueBytes', () => {
    it('sorts metadata keys deterministically regardless of input order', () => {
        const a = entryToValueBytes('btc', { metadata: { label: 'x', data: 1 }, counter: 1 });
        const b = entryToValueBytes('btc', { metadata: { data: 1, label: 'x' }, counter: 1 });

        expect(a).toEqual(b);
    });

    it('excludes the counter — the device stamps C_leaf inside the sealed content', () => {
        const c1 = entryToValueBytes('btc', { metadata: { label: 'x' }, counter: 1 });
        const c9 = entryToValueBytes('btc', { metadata: { label: 'x' }, counter: 9 });

        expect(c1).toEqual(c9);
    });

    it('binds the network symbol', () => {
        const btc = entryToValueBytes('btc', { metadata: { label: 'x' }, counter: 1 });
        const ltc = entryToValueBytes('ltc', { metadata: { label: 'x' }, counter: 1 });

        expect(btc).not.toEqual(ltc);
    });
});
