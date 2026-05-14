import { calculateXPubHash, calculateXPubHashes, checkXPubWithHashes } from '../calculateXPubHash';

// all seed standard wallet
const xpubs = {
    "m/84'/0'/0'":
        'xpub6DDUPHpUo4pcy43iJeZjbSVWGav1SMMmuWdMHiGtkK8rhKmfbomtkwW6GKs1GGAKehT6QRocrmda3WWxXawpjmwaUHfFRXuKrXSapdckEYF',
    "m/44'/60'/0'":
        'xpub6CNFa58kEQJu2hwMVoofpDEKVVSg6gfwqBqE2zHAianaUnQkrJzJJ42iLDp7Dmg2aP88qCKoFZ4jidk3tECdQuF4567NGHDfe7iBRwHxgke',
} as const;

const expectedHashes = {
    "m/84'/0'/0'": '62fb0296584531819ca112c129c547e0eb806300f07f3bc08ae086163034d09a',
    "m/44'/60'/0'": '6896a5c657f3af9e21b1d2038b69b8da921bb070820c245a0353c498a0686f05',
} as const;

describe(calculateXPubHash.name, () => {
    it('hashes xpub using sha256 (utf8 -> hex)', () => {
        expect(calculateXPubHash(xpubs["m/84'/0'/0'"])).toBe(expectedHashes["m/84'/0'/0'"]);
        expect(calculateXPubHash(xpubs["m/44'/60'/0'"])).toBe(expectedHashes["m/44'/60'/0'"]);
    });
});

describe(calculateXPubHashes.name, () => {
    it('hashes xpubs keyed by BIP43 path', () => {
        expect(calculateXPubHashes(xpubs)).toEqual(expectedHashes);
    });
});

describe(checkXPubWithHashes.name, () => {
    const knownXPubHashes = expectedHashes;

    it('returns true when hash matches for a known path', () => {
        expect(
            checkXPubWithHashes({
                xpub: xpubs["m/84'/0'/0'"],
                path: "m/84'/0'/0'",
                knownXPubHashes,
            }),
        ).toBe(true);
    });

    it('returns false when hash does not match for a known path', () => {
        expect(
            checkXPubWithHashes({
                xpub: 'something else',
                path: "m/44'/60'/0'",
                knownXPubHashes,
            }),
        ).toBe(false);
    });

    it('returns true when path is not present in known hashes', () => {
        expect(
            checkXPubWithHashes({
                xpub: xpubs["m/84'/0'/0'"],
                path: "m/49'/0'/0'",
                knownXPubHashes,
            }),
        ).toBe(true);
    });
});
