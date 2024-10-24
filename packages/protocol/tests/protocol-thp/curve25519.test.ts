import { elligator2, curve25519 } from '../../src/protocol-thp/crypto/curve25519';
import { elligator2fixtures, curve25519fixtures } from './curve25519.fixtures';

describe('curve25519', () => {
    it('elligator2', () => {
        elligator2fixtures.forEach(([input, output]) => {
            const point = Uint8Array.from(Buffer.from(input, 'hex'));
            const result = elligator2(point);
            expect(Buffer.from(result).toString('hex')).toEqual(output);
        });
    });

    curve25519fixtures.forEach(f => {
        it(`curve25519 ${f.description}`, () => {
            const publicKey = Buffer.from(f.public, 'hex');
            const privateKey = Buffer.from(f.private, 'hex');
            const secret = curve25519(privateKey, publicKey);
            expect(secret.toString('hex')).toEqual(f.shared);
        });
    });
});
