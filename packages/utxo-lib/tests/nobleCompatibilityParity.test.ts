// TODO(crypto-migration): Temporary migration guard.
// Remove this test and `tiny-secp256k1` devDependency after migration confidence window closes.
// Suggested exit criteria:
// - no parity regressions for at least two release cycles
import tinySecp from 'tiny-secp256k1';

import * as nobleCompat from '../src/noble-compatibility';

type Outcome =
    | { kind: 'throw' }
    | { kind: 'null' }
    | { kind: 'boolean'; value: boolean }
    | { kind: 'bytes'; value: string };

const ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

const to32Buffer = (value: bigint): Buffer =>
    Buffer.from(value.toString(16).padStart(64, '0'), 'hex');

const toOutcome = (value: unknown): Outcome => {
    if (value === null) {
        return { kind: 'null' };
    }

    if (typeof value === 'boolean') {
        return { kind: 'boolean', value };
    }

    if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
        return { kind: 'bytes', value: Buffer.from(value).toString('hex') };
    }

    throw new Error(`Unexpected outcome type: ${typeof value}`);
};

const capture = (callback: () => unknown): Outcome => {
    try {
        return toOutcome(callback());
    } catch {
        return { kind: 'throw' };
    }
};

const expectSameOutcome = (label: string, oldCall: () => unknown, newCall: () => unknown) => {
    const oldOutcome = capture(oldCall);
    const newOutcome = capture(newCall);

    if (JSON.stringify(newOutcome) !== JSON.stringify(oldOutcome)) {
        throw new Error(
            `${label}\nold=${JSON.stringify(oldOutcome)}\nnew=${JSON.stringify(newOutcome)}`,
        );
    }
};

describe('noble compatibility parity with tiny-secp256k1', () => {
    const privateOne = to32Buffer(1n);
    const privateTwo = to32Buffer(2n);
    const privateNMinusOne = to32Buffer(ORDER - 1n);
    const zero32 = Buffer.alloc(32, 0);
    const nScalar = to32Buffer(ORDER);
    const short31 = Buffer.alloc(31, 1);

    const validHash = Buffer.alloc(32, 42);
    const validEntropy = Buffer.alloc(32, 7);
    const invalidHash = Buffer.alloc(31, 9);

    const validPoint = Buffer.from(tinySecp.pointFromScalar(privateOne)!);
    const invalidPoint = Buffer.alloc(33, 0);

    it('matches isPrivate', () => {
        const privateCandidates = [
            privateOne,
            privateTwo,
            privateNMinusOne,
            zero32,
            nScalar,
            short31,
        ];

        privateCandidates.forEach(candidate => {
            expectSameOutcome(
                `isPrivate(${candidate.toString('hex')})`,
                () => tinySecp.isPrivate(candidate),
                () => nobleCompat.isPrivate(candidate),
            );
        });
    });

    it('matches isPoint', () => {
        const points = [validPoint, invalidPoint, Buffer.alloc(65, 0), Buffer.alloc(32, 1)];

        points.forEach(point => {
            expectSameOutcome(
                `isPoint(${point.toString('hex')})`,
                () => tinySecp.isPoint(point),
                () => nobleCompat.isPoint(point),
            );
        });
    });

    it('matches pointFromScalar', () => {
        const privateCandidates = [
            privateOne,
            privateTwo,
            privateNMinusOne,
            zero32,
            nScalar,
            short31,
        ];

        privateCandidates.forEach(candidate => {
            [true, false].forEach(compressed => {
                expectSameOutcome(
                    `pointFromScalar(${candidate.toString('hex')}, compressed=${compressed})`,
                    () => tinySecp.pointFromScalar(candidate, compressed),
                    () => nobleCompat.pointFromScalar(candidate, compressed),
                );
            });
        });
    });

    it('matches pointAddScalar', () => {
        const points = [validPoint, invalidPoint];
        const tweaks = [privateOne, privateNMinusOne, zero32, nScalar, short31];

        points.forEach(point => {
            tweaks.forEach(tweak => {
                [true, false].forEach(compressed => {
                    expectSameOutcome(
                        `pointAddScalar(p=${point.toString('hex')}, tweak=${tweak.toString('hex')}, compressed=${compressed})`,
                        () => tinySecp.pointAddScalar(point, tweak, compressed),
                        () => nobleCompat.pointAddScalar(point, tweak, compressed),
                    );
                });
            });
        });
    });

    it('matches privateAdd', () => {
        const keys = [privateOne, privateTwo, privateNMinusOne, zero32, nScalar, short31];
        const tweaks = [privateOne, privateNMinusOne, zero32, nScalar, short31];

        keys.forEach(key => {
            tweaks.forEach(tweak => {
                expectSameOutcome(
                    `privateAdd(d=${key.toString('hex')}, tweak=${tweak.toString('hex')})`,
                    () => tinySecp.privateAdd(key, tweak),
                    () => nobleCompat.privateAdd(key, tweak),
                );
            });
        });
    });

    it('matches sign', () => {
        const privateCandidates = [privateOne, privateNMinusOne, zero32, nScalar];
        const hashes = [validHash, invalidHash];

        privateCandidates.forEach(privateKey => {
            hashes.forEach(hash => {
                expectSameOutcome(
                    `sign(hashLen=${hash.length}, private=${privateKey.toString('hex')})`,
                    () => tinySecp.sign(hash, privateKey),
                    () => nobleCompat.sign(hash, privateKey),
                );
            });
        });
    });

    it('matches signWithEntropy', () => {
        const privateCandidates = [privateOne, privateNMinusOne, zero32, nScalar];
        const hashes = [validHash, invalidHash];
        const entropyCandidates = [validEntropy, Buffer.alloc(31, 1)];

        privateCandidates.forEach(privateKey => {
            hashes.forEach(hash => {
                entropyCandidates.forEach(extraEntropy => {
                    expectSameOutcome(
                        `signWithEntropy(hashLen=${hash.length}, private=${privateKey.toString('hex')}, entropyLen=${extraEntropy.length})`,
                        () => tinySecp.signWithEntropy(hash, privateKey, extraEntropy),
                        () => nobleCompat.signWithEntropy(hash, privateKey, extraEntropy),
                    );
                });
            });
        });
    });

    it('matches verify', () => {
        const signature = Buffer.from(tinySecp.sign(validHash, privateOne));
        const invalidSignature = Buffer.alloc(64, 0);

        const hashes = [validHash, Buffer.alloc(32, 43), invalidHash];
        const publicKeys = [validPoint, invalidPoint, Buffer.alloc(65, 0)];
        const signatures = [signature, invalidSignature, Buffer.alloc(63, 1)];

        hashes.forEach(hash => {
            publicKeys.forEach(publicKey => {
                signatures.forEach(signatureCandidate => {
                    expectSameOutcome(
                        `verify(hash=${hash.toString('hex')}, pub=${publicKey.toString('hex')}, sig=${signatureCandidate.toString('hex')})`,
                        () => tinySecp.verify(hash, publicKey, signatureCandidate),
                        () => nobleCompat.verify(hash, publicKey, signatureCandidate),
                    );
                });
            });
        });
    });
});
