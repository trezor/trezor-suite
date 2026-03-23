// TODO(crypto-migration): Temporary migration guard.
// Remove this test and `tiny-secp256k1` devDependency after migration confidence window closes.

import tinySecp from 'tiny-secp256k1';

import * as nobleCompat from '../src/noble-compatibility';

type Outcome =
    | { kind: 'throw' }
    | { kind: 'null' }
    | { kind: 'boolean'; value: boolean }
    | { kind: 'bytes'; value: string };

const ORDER = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');

const ITERATIONS = 200;
const SEED = 0x5eed1234;

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

const createXorShift32 = (seed: number) => {
    let state = seed >>> 0;

    return () => {
        state ^= state << 13;
        state >>>= 0;
        state ^= state >>> 17;
        state >>>= 0;
        state ^= state << 5;
        state >>>= 0;

        return state;
    };
};

describe('noble compatibility deterministic fuzz parity with tiny-secp256k1', () => {
    const nextUint32 = createXorShift32(SEED);

    const privateOne = to32Buffer(1n);
    const privateNMinusOne = to32Buffer(ORDER - 1n);
    const zero32 = Buffer.alloc(32, 0);
    const nScalar = to32Buffer(ORDER);

    const edgeScalars = [privateOne, privateNMinusOne, zero32, nScalar];

    const randomBuffer = (length: number) => {
        const bytes = Buffer.alloc(length);
        for (let i = 0; i < length; i++) {
            bytes[i] = nextUint32() & 0xff;
        }

        return bytes;
    };

    const randomBoolean = () => (nextUint32() & 1) === 0;

    const randomItem = <T>(items: T[]): T => items[nextUint32() % items.length];

    const randomScalarCandidate = () => {
        if (nextUint32() % 4 === 0) {
            return Buffer.from(randomItem(edgeScalars));
        }

        const randomLength = randomItem([31, 32, 33]);

        return randomBuffer(randomLength);
    };

    const randomHashCandidate = () => {
        const randomLength = randomItem([31, 32, 33]);

        return randomBuffer(randomLength);
    };

    const randomEntropyCandidate = () => {
        const randomLength = randomItem([31, 32]);

        return randomBuffer(randomLength);
    };

    const randomPointCandidate = () => {
        // Mix generated valid points and malformed points.
        if (nextUint32() % 3 === 0) {
            const scalar = randomScalarCandidate();
            const point = capture(() => tinySecp.pointFromScalar(scalar));

            if (point.kind === 'bytes') {
                return Buffer.from(point.value, 'hex');
            }
        }

        const randomLength = randomItem([32, 33, 65]);

        return randomBuffer(randomLength);
    };

    it(`matches deterministic random fixtures (seed=${SEED}, iterations=${ITERATIONS})`, () => {
        for (let i = 0; i < ITERATIONS; i++) {
            const scalar = randomScalarCandidate();
            const tweak = randomScalarCandidate();
            const hash = randomHashCandidate();
            const extraEntropy = randomEntropyCandidate();
            const point = randomPointCandidate();
            const compressed = randomBoolean();

            const verifyHash = randomHashCandidate();
            const verifyPrivate = randomItem([privateOne, privateNMinusOne]);
            const verifyPub = Buffer.from(tinySecp.pointFromScalar(verifyPrivate)!);
            const verifyValidSig = Buffer.from(tinySecp.sign(randomBuffer(32), verifyPrivate));
            const verifySigCandidate = randomItem([
                verifyValidSig,
                Buffer.alloc(64, 0),
                randomBuffer(64),
                randomBuffer(63),
            ]);
            const verifyPubCandidate = randomItem([verifyPub, point, randomPointCandidate()]);

            const caseId = `seed=${SEED} i=${i}`;

            expectSameOutcome(
                `${caseId} isPrivate`,
                () => tinySecp.isPrivate(scalar),
                () => nobleCompat.isPrivate(scalar),
            );

            expectSameOutcome(
                `${caseId} isPoint`,
                () => tinySecp.isPoint(point),
                () => nobleCompat.isPoint(point),
            );

            expectSameOutcome(
                `${caseId} pointFromScalar compressed=${compressed}`,
                () => tinySecp.pointFromScalar(scalar, compressed),
                () => nobleCompat.pointFromScalar(scalar, compressed),
            );

            expectSameOutcome(
                `${caseId} pointAddScalar compressed=${compressed}`,
                () => tinySecp.pointAddScalar(point, tweak, compressed),
                () => nobleCompat.pointAddScalar(point, tweak, compressed),
            );

            expectSameOutcome(
                `${caseId} privateAdd`,
                () => tinySecp.privateAdd(scalar, tweak),
                () => nobleCompat.privateAdd(scalar, tweak),
            );

            expectSameOutcome(
                `${caseId} sign`,
                () => tinySecp.sign(hash, scalar),
                () => nobleCompat.sign(hash, scalar),
            );

            expectSameOutcome(
                `${caseId} signWithEntropy`,
                () => tinySecp.signWithEntropy(hash, scalar, extraEntropy),
                () => nobleCompat.signWithEntropy(hash, scalar, extraEntropy),
            );

            expectSameOutcome(
                `${caseId} verify`,
                () => tinySecp.verify(verifyHash, verifyPubCandidate, verifySigCandidate),
                () => nobleCompat.verify(verifyHash, verifyPubCandidate, verifySigCandidate),
            );
        }
    });
});
