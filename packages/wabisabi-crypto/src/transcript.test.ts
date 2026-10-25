import * as Generators from './generators';
import { GroupElement } from './groupElement';
import { DOMAIN_STROBE_SEPARATOR, WABISABI_PROTOCOL_IDENTIFIER } from './protocolConstants';
import { secureRandom } from './random';
import { SCALAR_ONE, SCALAR_ZERO, type Scalar, scalarFromBytes } from './scalar';
import { Strobe128, type StrobeFlags, int32ToBytes } from './strobe';
import { constantRandom } from './testing';
import { Transcript } from './transcript';

const textEncoder = new TextEncoder();

const concat = (a: Uint8Array, b: Uint8Array) => {
    const result = new Uint8Array(a.length + b.length);
    result.set(a);
    result.set(b, a.length);

    return result;
};

/**
 * Port of `NWabiSabi/WabiSabi.Tests/Crypto/TestTranscript.cs`.
 *
 * An independent reimplementation of the transcript, written against the Strobe
 * primitive directly. It concatenates each label with its length into a single
 * meta-data operation where `Transcript` uses `more: true` to continue one, which is
 * the same absorption; the point of the duplicate is that the two must agree.
 */
class TestTranscript {
    private readonly strobe: Strobe128;

    constructor(label: Uint8Array) {
        this.strobe = new Strobe128(WABISABI_PROTOCOL_IDENTIFIER);
        const metadata = concat(
            textEncoder.encode(DOMAIN_STROBE_SEPARATOR),
            int32ToBytes(label.length),
        );
        this.strobe.addAssociatedMetaData(metadata, false);
        this.strobe.addAssociatedData(label, false);
    }

    commitPublicNonces(nonces: readonly GroupElement[]) {
        const label = textEncoder.encode('nonce-commitment');
        this.strobe.addAssociatedMetaData(concat(label, int32ToBytes(nonces.length)), false);

        nonces.forEach((nonce, index) => {
            this.strobe.addAssociatedMetaData(concat(int32ToBytes(index), int32ToBytes(33)), false);
            this.strobe.addAssociatedData(nonce.toBytes(), false);
        });
    }

    generateChallenge(): Scalar {
        this.strobe.addAssociatedMetaData(textEncoder.encode('challenge'), false);

        return scalarFromBytes(this.strobe.prf(32, false)).scalar;
    }
}

describe('Transcript', () => {
    // Port of `SimpleEquivalenceTest` in TranscriptTests.cs
    it('agrees with an independent implementation on a single challenge', () => {
        const protocol = textEncoder.encode('test protocol');
        const realTranscript = new Transcript(protocol);
        const testTranscript = new TestTranscript(protocol);

        realTranscript.commitPublicNonces([Generators.G]);
        testTranscript.commitPublicNonces([Generators.G]);

        expect(realTranscript.generateChallenge()).toBe(testTranscript.generateChallenge());
    });

    // Port of `ComplexEquivalenceTest` in TranscriptTests.cs
    it('agrees with an independent implementation over 32 rounds', () => {
        const protocol = textEncoder.encode('test protocol');
        const realTranscript = new Transcript(protocol);
        const testTranscript = new TestTranscript(protocol);

        realTranscript.commitPublicNonces([Generators.G]);
        testTranscript.commitPublicNonces([Generators.G]);

        for (let i = 0; i < 32; i++) {
            expect(realTranscript.generateChallenge()).toBe(testTranscript.generateChallenge());

            realTranscript.commitPublicNonces([Generators.G, Generators.GV]);
            testTranscript.commitPublicNonces([Generators.G, Generators.GV]);
        }
    });

    // Port of `SyntheticNoncesTest` in TranscriptTests.cs
    it('derives distinct synthetic nonces for distinct commitments and witnesses', () => {
        const protocol = textEncoder.encode('test TranscriptRng collisions');
        const witness1 = [secureRandom.getScalar()];
        const witness2 = [secureRandom.getScalar()];

        const build = (commitment: GroupElement, witness: Scalar[]) => {
            const transcript = new Transcript(protocol);
            transcript.commitPublicNonces([commitment]);

            return transcript.createSyntheticSecretNonceProvider(witness, secureRandom).getScalar();
        };

        const nonces = [
            build(Generators.Gx0, witness1),
            build(Generators.Gx1, witness1),
            build(Generators.Gx1, witness2),
            build(Generators.Gx1, witness2),
        ];

        expect(new Set(nonces).size).toBe(4);
    });

    // Port of `SyntheticNoncesSecretDependenceTest` in TranscriptTests.cs
    it('diverges on commitment and witness even when the RNG contributes nothing', () => {
        const protocol = textEncoder.encode('test TranscriptRng collisions');
        const random = constantRandom();

        const build = (commitment: GroupElement, witness: Scalar[]) => {
            const transcript = new Transcript(protocol);
            transcript.commitPublicNonces([commitment]);

            return transcript.createSyntheticSecretNonceProvider(witness, random).getScalar();
        };

        const nonce1 = build(Generators.Gx0, [SCALAR_ONE]);
        const nonce2 = build(Generators.Gx1, [SCALAR_ONE]);
        const nonce3 = build(Generators.Gx1, [SCALAR_ZERO]);
        const nonce4 = build(Generators.Gx1, [SCALAR_ZERO]);

        expect(nonce1).not.toBe(nonce2);
        expect(nonce1).not.toBe(nonce3);
        expect(nonce2).not.toBe(nonce3);
        // Same public inputs, same witness, no randomness: necessarily identical.
        expect(nonce3).toBe(nonce4);
    });

    // Port of `SyntheticNoncesVectorTest` in TranscriptTests.cs
    it.each([1, 3, 5, 7])('returns one nonce per witness term for size %i', size => {
        const transcript = new Transcript(textEncoder.encode('witness size'));
        const witness = new Array<Scalar>(size).fill(SCALAR_ZERO);
        const nonces = transcript
            .createSyntheticSecretNonceProvider(witness, secureRandom)
            .getScalarVector();

        expect(nonces).toHaveLength(size);
    });

    // Port of `SyntheticNoncesThrows` in TranscriptTests.cs
    it('rejects an empty witness', () => {
        const transcript = new Transcript(textEncoder.encode('empty witness not allowed'));

        expect(() => transcript.createSyntheticSecretNonceProvider([], secureRandom)).toThrow(
            'secrets cannot be empty',
        );
    });

    it('rejects committing no nonces or the point at infinity', () => {
        const transcript = new Transcript(textEncoder.encode('x'));

        expect(() => transcript.commitPublicNonces([])).toThrow('cannot be empty');
        expect(() => transcript.commitPublicNonces([GroupElement.INFINITY])).toThrow(
            'point at infinity',
        );
    });

    it('is restorable from a dumped Strobe state', () => {
        const transcript = new Transcript(textEncoder.encode('restore me'));
        transcript.commitPublicNonces([Generators.G]);

        const restored = Transcript.fromStrobeState(transcript.dumpState());

        expect(restored.generateChallenge()).toBe(transcript.generateChallenge());
    });

    it('rejects a Strobe state of the wrong size', () => {
        expect(() =>
            Transcript.fromStrobeState({
                state: new Uint8Array(199),
                position: 0,
                beginPosition: 0,
                currentFlags: 0 as StrobeFlags,
            }),
        ).toThrow('A Strobe state is 200 bytes');
    });
});
