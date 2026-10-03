import { convertTaprootXpub, toCanonicalDescriptor } from './convertTaprootXpub';

describe('convertTaprootXpub', () => {
    // Same descriptor, once with `h` and once with `'` for the hardened path parts.
    // Note the xpub body itself contains an `h` (in "...ThRDb8...") which must be
    // left untouched - only the bracketed path is converted.
    const withH =
        '[5c9e228d/86h/0h/0h]tpubDCpt6oCoUgcQEPBUnZS4pijgjNySRDaJH8FyztXHnjxCH3z8jjHKGpX3zwtNs1U8ThRDb8ZbnAnZWc1KNLQx8fasQnk3f9Vaqu3JJXcYCF';
    const withApostrophe =
        "[5c9e228d/86'/0'/0']tpubDCpt6oCoUgcQEPBUnZS4pijgjNySRDaJH8FyztXHnjxCH3z8jjHKGpX3zwtNs1U8ThRDb8ZbnAnZWc1KNLQx8fasQnk3f9Vaqu3JJXcYCF";

    it('converts h to apostrophe in the derivation path', () => {
        expect(convertTaprootXpub({ xpub: withH, direction: 'h-to-apostrophe' })).toEqual(
            withApostrophe,
        );
    });

    it('converts apostrophe to h in the derivation path', () => {
        expect(convertTaprootXpub({ xpub: withApostrophe, direction: 'apostrophe-to-h' })).toEqual(
            withH,
        );
    });

    it('round-trips', () => {
        const apostrophe = convertTaprootXpub({ xpub: withH, direction: 'h-to-apostrophe' });
        expect(apostrophe).not.toBeNull();
        expect(
            convertTaprootXpub({ xpub: apostrophe as string, direction: 'apostrophe-to-h' }),
        ).toEqual(withH);
    });

    it('only touches the bracketed path, leaving the xpub body unchanged', () => {
        const out = convertTaprootXpub({ xpub: withH, direction: 'h-to-apostrophe' });
        expect(out).not.toBeNull();
        // Everything after the closing bracket (the xpub body, which contains an `h`)
        // must be identical.
        expect((out as string).split(']')[1]).toEqual(withH.split(']')[1]);
    });

    it('returns null for an xpub without a descriptor bracket', () => {
        expect(
            convertTaprootXpub({ xpub: 'tpubDCpt6oCoUgcQEPBU', direction: 'h-to-apostrophe' }),
        ).toBeNull();
    });
});

describe('toCanonicalDescriptor', () => {
    const withH =
        '[5c9e228d/86h/0h/0h]tpubDCpt6oCoUgcQEPBUnZS4pijgjNySRDaJH8FyztXHnjxCH3z8jjHKGpX3zwtNs1U8ThRDb8ZbnAnZWc1KNLQx8fasQnk3f9Vaqu3JJXcYCF';
    const withApostrophe =
        "[5c9e228d/86'/0'/0']tpubDCpt6oCoUgcQEPBUnZS4pijgjNySRDaJH8FyztXHnjxCH3z8jjHKGpX3zwtNs1U8ThRDb8ZbnAnZWc1KNLQx8fasQnk3f9Vaqu3JJXcYCF";

    it('normalizes the firmware `h` form to the canonical apostrophe form', () => {
        expect(toCanonicalDescriptor(withH)).toEqual(withApostrophe);
    });

    it('is idempotent on an already-canonical descriptor', () => {
        expect(toCanonicalDescriptor(withApostrophe)).toEqual(withApostrophe);
    });

    it('passes non-taproot descriptors through unchanged (address, plain xpub, empty)', () => {
        const address = '0x1234567890abcdef1234567890abcdef12345678';
        expect(toCanonicalDescriptor(address)).toEqual(address);
        expect(toCanonicalDescriptor('tpubDCpt6oCoUgcQEPBU')).toEqual('tpubDCpt6oCoUgcQEPBU');
        expect(toCanonicalDescriptor('')).toEqual('');
    });
});
