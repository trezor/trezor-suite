import * as ecc from '../src/noble-compatibility';

const ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

const to32Buffer = (value: bigint): Buffer =>
    Buffer.from(value.toString(16).padStart(64, '0'), 'hex');

describe('noble compatibility', () => {
    const privateOne = to32Buffer(1n);
    const privateTwo = to32Buffer(2n);
    const privateNMinusOne = to32Buffer(ORDER - 1n);
    const zero32 = Buffer.alloc(32, 0);

    it('isPrivate matches secp256k1 bounds', () => {
        expect(ecc.isPrivate(privateOne)).toEqual(true);
        expect(ecc.isPrivate(privateNMinusOne)).toEqual(true);
        expect(ecc.isPrivate(zero32)).toEqual(false);
        expect(ecc.isPrivate(to32Buffer(ORDER))).toEqual(false);
        expect(ecc.isPrivate(Buffer.alloc(31, 1))).toEqual(false);
    });

    it('pointFromScalar returns known generator point and null for invalid scalar', () => {
        expect(ecc.pointFromScalar(privateOne)?.toString('hex')).toEqual(
            '0279be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
        );
        expect(ecc.pointFromScalar(privateOne, false)?.toString('hex')).toEqual(
            '0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
        );
        expect(() => ecc.pointFromScalar(zero32)).toThrow();
    });

    it('pointAddScalar behaves like tweak-add and returns null for invalid cases', () => {
        const pointOne = ecc.pointFromScalar(privateOne);

        expect(pointOne).toBeDefined();
        expect(pointOne).not.toEqual(null);
        expect(ecc.pointAddScalar(pointOne!, privateOne)?.toString('hex')).toEqual(
            ecc.pointFromScalar(privateTwo)?.toString('hex'),
        );

        expect(ecc.pointAddScalar(pointOne!, privateNMinusOne)).toEqual(null);
        expect(ecc.pointAddScalar(pointOne!, zero32)?.toString('hex')).toEqual(
            pointOne?.toString('hex'),
        );
        expect(() => ecc.pointAddScalar(Buffer.alloc(33, 0), privateOne)).toThrow();
    });

    it('privateAdd returns null for invalid input and zero result', () => {
        expect(ecc.privateAdd(privateOne, privateOne)?.toString('hex')).toEqual(
            privateTwo.toString('hex'),
        );
        expect(ecc.privateAdd(privateNMinusOne, privateOne)).toEqual(null);
        expect(ecc.privateAdd(privateOne, zero32)?.toString('hex')).toEqual(
            privateOne.toString('hex'),
        );
        expect(() => ecc.privateAdd(zero32, privateOne)).toThrow();
    });

    it('sign and verify are compatible for valid and invalid data', () => {
        const messageHash = Buffer.alloc(32, 2);
        const wrongHash = Buffer.alloc(32, 3);
        const publicKey = ecc.pointFromScalar(privateOne);

        expect(publicKey).toBeDefined();
        expect(publicKey).not.toEqual(null);

        const signature = ecc.sign(messageHash, privateOne);

        expect(signature.length).toEqual(64);
        expect(ecc.verify(messageHash, publicKey!, signature)).toEqual(true);
        expect(ecc.verify(wrongHash, publicKey!, signature)).toEqual(false);
        expect(() => ecc.verify(messageHash, Buffer.alloc(33, 0), signature)).toThrow();
        expect(ecc.verify(messageHash, publicKey!, Buffer.alloc(64, 0))).toEqual(false);
    });

    it('signWithEntropy is deterministic for fixed entropy', () => {
        const messageHash = Buffer.alloc(32, 7);
        const extraEntropy = Buffer.alloc(32, 9);

        const signatureA = ecc.signWithEntropy(messageHash, privateOne, extraEntropy);
        const signatureB = ecc.signWithEntropy(messageHash, privateOne, extraEntropy);

        expect(signatureA.toString('hex')).toEqual(signatureB.toString('hex'));
    });
});
