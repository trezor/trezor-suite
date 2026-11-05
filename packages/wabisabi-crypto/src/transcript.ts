import { type GroupElement } from './groupElement';
import { type Statement } from './linearRelation';
import { WABISABI_PROTOCOL_IDENTIFIER } from './protocolConstants';
import { type Random } from './random';
import { SCALAR_BYTES, type Scalar, scalarFromBytes, scalarToBytes } from './scalar';
import { Strobe128, type StrobeState, int32ToBytes } from './strobe';

const KEY_SIZE_IN_BYTES = 32;

/**
 * Cache of `BitConverter.GetBytes(int)` for the small indices and lengths a statement
 * commitment uses. A 42-bit range proof statement commits about eleven thousand
 * elements, each contributing an index and a length, so these are the same few thousand
 * values over and over.
 */
const INT32_CACHE_SIZE = 16_384;
const int32Cache: Uint8Array[] = [];
const cachedInt32ToBytes = (value: number) => {
    if (value < 0 || value >= INT32_CACHE_SIZE) {
        return int32ToBytes(value);
    }
    const cached = int32Cache[value];
    if (cached !== undefined) {
        return cached;
    }
    const bytes = int32ToBytes(value);
    int32Cache[value] = bytes;

    return bytes;
};

const textEncoder = new TextEncoder();
const STATEMENT_TAG = textEncoder.encode('statement');
const CHALLENGE_TAG = textEncoder.encode('challenge');
const PUBLIC_NONCE_TAG = textEncoder.encode('nonce-commitment');
const DOMAIN_SEPARATOR_TAG = textEncoder.encode('domain-separator');

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/ZeroKnowledge/SyntheticSecretNonceProvider.cs`.
 *
 * Nonces depend on the witness as well as on the RNG, so a broken RNG cannot leak the
 * witness by reusing a nonce across challenges.
 */
export class SyntheticSecretNonceProvider {
    private readonly strobe!: Strobe128;
    private readonly secretCount: number;

    constructor(strobe: Strobe128, secrets: readonly Scalar[], random: Random) {
        if (secrets.length === 0) {
            throw new Error('secrets cannot be empty.');
        }
        this.strobe = strobe;
        this.secretCount = secrets.length;

        // Add secret inputs as key material.
        for (const secret of secrets) {
            this.strobe.key(scalarToBytes(secret), false);
        }

        this.strobe.key(random.getBytes(32), false);
    }

    private next(): Scalar {
        for (;;) {
            const { scalar, overflow } = scalarFromBytes(this.strobe.prf(SCALAR_BYTES, false));
            if (!overflow) {
                return scalar;
            }
        }
    }

    /** `SyntheticSecretNonceProvider.GetScalar()` — `Sequence().First()`, one draw. */
    getScalar(): Scalar {
        return this.next();
    }

    /**
     * `SyntheticSecretNonceProvider.GetScalarVector()`.
     *
     * Upstream is `new ScalarVector(Sequence().Take(_secretCount))`, and
     * `ScalarVector`'s constructor runs `Guard.NotNullOrEmpty`, which calls `.Any()` on
     * that lazy, infinite, *side-effecting* sequence. `.Any()` pulls one scalar out of
     * the Strobe PRF and throws it away; `.ToArray()` then starts a fresh iterator over
     * `Sequence()` and gets the following `_secretCount` scalars. So the provider draws
     * `1 + secretCount` times and returns draws 2..secretCount+1. Without this discarded
     * first draw none of the committed test vectors reproduce.
     */
    getScalarVector(): Scalar[] {
        this.next();

        return Array.from({ length: this.secretCount }, () => this.next());
    }
}

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/ZeroKnowledge/Transcript.cs`.
 *
 * High level API for transcripts of compound Sigma protocol style proofs; implements
 * synthetic nonces and Fiat-Shamir challenges. The live object is held in round state
 * between building a credential request and handling the coordinator's response. It is
 * never persisted and never crosses IPC.
 */
export class Transcript {
    private readonly strobe!: Strobe128;

    constructor(label: Uint8Array) {
        this.strobe = new Strobe128(WABISABI_PROTOCOL_IDENTIFIER);
        this.addMessage(DOMAIN_SEPARATOR_TAG, label);
    }

    /**
     * Rebuilds a transcript from a dumped Strobe state.
     *
     * Production code holds the transcript as a live object between building a
     * credential request and handling the response, so it never needs this. The
     * upstream test vectors do: they carry the transcript state alongside the request,
     * because the binary had to hand it back to Suite over HTTP.
     */
    static fromStrobeState(dumped: StrobeState) {
        const transcript = Object.create(Transcript.prototype) as unknown as {
            strobe: Strobe128;
        };
        transcript.strobe = new Strobe128(dumped);

        return transcript as unknown as Transcript;
    }

    /** Generate a synthetic nonce provider from the current state plus fresh randomness. */
    createSyntheticSecretNonceProvider(secrets: readonly Scalar[], random: Random) {
        return new SyntheticSecretNonceProvider(this.strobe.makeCopy(), secrets, random);
    }

    commitPublicNonces(publicNonces: readonly GroupElement[]) {
        if (publicNonces.length === 0 || publicNonces.some(nonce => nonce.isInfinity)) {
            throw new Error('publicNonces cannot be empty or contain the point at infinity.');
        }
        this.addMessages(
            PUBLIC_NONCE_TAG,
            publicNonces.map(nonce => nonce.toBytes()),
        );
    }

    commitStatement(statement: Statement) {
        this.addMessages(STATEMENT_TAG, [
            ...statement.publicPoints.map(point => point.toBytes()),
            ...statement.generators.map(generator => generator.toBytes()),
        ]);
    }

    /** Generate a Fiat-Shamir challenge. */
    generateChallenge(): Scalar {
        for (;;) {
            this.strobe.addAssociatedMetaData(CHALLENGE_TAG, false);
            const { scalar, overflow } = scalarFromBytes(this.strobe.prf(KEY_SIZE_IN_BYTES, false));
            if (!overflow) {
                return scalar;
            }
        }
    }

    /** The serialized Strobe state, as the upstream test vectors report it. */
    dumpState(): StrobeState {
        return this.strobe.dump();
    }

    private addMessage(label: Uint8Array, message: Uint8Array) {
        this.strobe.addAssociatedMetaData(label, false);
        this.strobe.addAssociatedMetaData(cachedInt32ToBytes(message.length), true);
        this.strobe.addAssociatedData(message, false);
    }

    private addMessages(label: Uint8Array, messages: readonly Uint8Array[]) {
        this.strobe.addAssociatedMetaData(label, false);
        this.strobe.addAssociatedMetaData(cachedInt32ToBytes(messages.length), true);
        for (let index = 0; index < messages.length; index++) {
            this.addMessage(cachedInt32ToBytes(index), messages[index] as Uint8Array);
        }
    }
}
