import { deriveCommitmentMask, generateKeyDerivation, writeVarint } from '../commitmentMask';
import { bytesToHex } from '../hex';

// Official Monero crypto vectors (monero-project/monero tests/crypto/tests.txt) for
// generate_key_derivation: generate_key_derivation <R (pub)> <a (sec)> -> <ok> <derivation>.
const KEY_DERIVATION_VECTORS = [
    {
        txPubKey: 'fdfd97d2ea9f1c25df773ff2c973d885653a3ee643157eb0ae2b6dd98f0b6984',
        viewKey: 'eb2bd1cf0c5e074f9dbf38ebbc99c316f54e21803048c687a3bb359f7a713b02',
        derivation: '4e0bd2c41325a1b89a9f7413d4d05e0a5a4936f241dccc3c7d0c539ffe00ef67',
    },
    {
        txPubKey: '1ebf8c3c296bb91708b09d9a8e0639ccfd72556976419c7dc7e6dfd7599218b9',
        viewKey: 'e49f363fd5c8fc1f8645983647ca33d7ec9db2d255d94cd538a3cc83153c5f04',
        derivation: '72903ec8f9919dfcec6efb5535490527b573b3d77f9890386d373c02bf368934',
    },
    {
        txPubKey: '3e3047a633b1f84250ae11b5c8e8825a3df4729f6cbe4713b887db62f268187d',
        viewKey: '6df324e24178d91c640b75ab1c6905f8e6bb275bc2c2a5d9b9ecf446765a5a05',
        derivation: '9dcac9c9e87dd96a4115d84d587218d8bf165a0527153b1c306e562fe39a46ab',
    },
];

describe('generateKeyDerivation', () => {
    it.each(KEY_DERIVATION_VECTORS)(
        'matches the official 8*(a*R) vector for $derivation',
        ({ txPubKey, viewKey, derivation }) => {
            expect(bytesToHex(generateKeyDerivation(txPubKey, viewKey))).toBe(derivation);
        },
    );
});

describe('writeVarint', () => {
    it.each([
        [0, '00'],
        [1, '01'],
        [127, '7f'],
        [128, '8001'],
        [300, 'ac02'],
        // A large in-tx index (many-output tx) must encode multi-byte: 217407 -> bf a2 0d
        // (217407 = 0x3f + 0x22*128 + 13*128^2).
        [217407, 'bfa20d'],
    ])('encodes %i as LEB128 %s', (value, hex) => {
        expect(bytesToHex(writeVarint(value))).toBe(hex);
    });

    it('rejects a negative index', () => {
        expect(() => writeVarint(-1)).toThrow('non-negative integer');
    });
});

describe('deriveCommitmentMask', () => {
    // End-to-end golden vector: mask = genCommitmentMask(derivation_to_scalar(8*(a*R), 0)).
    // a/R are key-derivation vector #1; the expected mask was computed with a Hs implementation that
    // reproduces every official hash_to_scalar vector byte-for-byte.
    it('derives the deterministic commitment mask for index 0', () => {
        expect(
            deriveCommitmentMask({
                viewKey: 'eb2bd1cf0c5e074f9dbf38ebbc99c316f54e21803048c687a3bb359f7a713b02',
                txPubKey: 'fdfd97d2ea9f1c25df773ff2c973d885653a3ee643157eb0ae2b6dd98f0b6984',
                outputIndex: 0,
            }),
        ).toBe('f95460dd42884237044c263f427a420506933d90c5e487fb63d4d04f09638f0f');
    });

    it('changes the mask when the output index changes', () => {
        const params = {
            viewKey: 'eb2bd1cf0c5e074f9dbf38ebbc99c316f54e21803048c687a3bb359f7a713b02',
            txPubKey: 'fdfd97d2ea9f1c25df773ff2c973d885653a3ee643157eb0ae2b6dd98f0b6984',
        };
        expect(deriveCommitmentMask({ ...params, outputIndex: 0 })).not.toBe(
            deriveCommitmentMask({ ...params, outputIndex: 1 }),
        );
    });
});
