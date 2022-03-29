import * as hdnode from '../hdnodeUtils';
import * as fixtures from '../__fixtures__/hdnodeUtils';

describe('utils/hdnode', () => {
    describe('convertXpub', () => {
        fixtures.convertXpub.forEach(f => {
            it(f.description, () => {
                const result = hdnode.convertXpub(f.xpub, f.network, f.requestedNetwork);
                expect(result).toEqual(f.result);
            });
        });
    });

    describe('convertBitcoinXpub', () => {
        fixtures.convertBitcoinXpub.forEach(f => {
            it(f.description, () => {
                const result = hdnode.convertBitcoinXpub(f.xpub, f.network);
                expect(result).toEqual(f.result);
            });
        });
    });

    describe('convertMultisigPubKey', () => {
        fixtures.convertMultisigPubKey.forEach(f => {
            it(f.description, () => {
                // @ts-expect-error, incomplete utxo
                const result = hdnode.convertMultisigPubKey(f.network!, f.utxo);
                expect(result).toEqual(f.result);
            });
        });
    });

    describe('xpubDerive', () => {
        fixtures.xpubDerive.forEach(f => {
            it(f.description, () => {
                if (f.error) {
                    expect(() =>
                        hdnode.xpubDerive(f.xpub, f.childXPub, f.suffix, f.network),
                    ).toThrow(f.error);
                } else {
                    expect(() =>
                        hdnode.xpubDerive(f.xpub, f.childXPub, f.suffix, f.network),
                    ).not.toThrow();
                }
            });
        });
    });
});
