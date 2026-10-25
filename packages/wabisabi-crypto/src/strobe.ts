import { keccakP } from '@noble/hashes/sha3.js';

import { WABISABI_PROTOCOL_IDENTIFIER } from './protocolConstants';

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/StrobeProtocol/StrobeFlags.cs`.
 *
 * The behaviour of each of Strobe's operations is defined completely by six flags.
 */
export enum StrobeFlags {
    /** Inbound. */
    I = 1,
    /** Application. */
    A = 2,
    /** Cipher. */
    C = 4,
    /** Transport. */
    T = 8,
    /** Meta. */
    M = 16,
    /** Keytree. */
    K = 32,
}

const D_DATA = 0x04;
const D_RATE = 0x80;

/**
 * This is the portion of the rate which is used for user data, measured in bytes:
 * `r̂ = r / 8 − 2` for `r = 1344`.
 */
const SPONGE_RATE = 166;

const STATE_BYTES = 25 * 8;

const textEncoder = new TextEncoder();

const concat = (...arrays: Uint8Array[]) => {
    const result = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
    let offset = 0;
    for (const array of arrays) {
        result.set(array, offset);
        offset += array.length;
    }

    return result;
};

/**
 * `BitConverter.GetBytes(int)` — little-endian, four bytes.
 *
 * Committing a 42-bit range proof statement calls this about twenty thousand times, once
 * for each element's index and once for its length, so it avoids allocating a `DataView`
 * and the length argument — always 33 for a group element — is served from a cache.
 */
export const int32ToBytes = (value: number) => {
    const bytes = new Uint8Array(4);
    bytes[0] = value & 0xff;
    bytes[1] = (value >>> 8) & 0xff;
    bytes[2] = (value >>> 16) & 0xff;
    bytes[3] = (value >>> 24) & 0xff;

    return bytes;
};

/** The serialized sponge state; see `Strobe128.dump`. */
export interface StrobeState {
    state: Uint8Array;
    position: number;
    beginPosition: number;
    currentFlags: StrobeFlags;
}

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/StrobeProtocol/Strobe.cs`.
 *
 * https://strobe.sourceforge.io/papers/strobe-20170130.pdf
 * Based on the Merlin framework's small implementation:
 * https://github.com/dalek-cryptography/merlin/blob/1ed350bbc1d65f0a0697e0c20c48e11ec172c6ff/src/strobe.rs
 *
 * `keccakP` from `@noble/hashes` is exactly the keccak-f1600 permutation upstream
 * inlines from Bouncy Castle. It operates on a `Uint32Array` of 50 little-endian
 * words, which is the same memory layout as upstream's `byte[200]` reinterpreted as
 * `Span<ulong>` on a little-endian machine.
 */
export class Strobe128 {
    /** 25 lanes of 64 bits, viewed as bytes. This is the block size used by keccak-f1600. */
    private readonly _state: Uint8Array;
    /** The same buffer as `_state`, as the 32-bit word view `keccakP` wants. */
    private readonly _words: Uint32Array;
    private _position = 0;
    private _beginPosition = 0;
    private _currentFlags: StrobeFlags = 0 as StrobeFlags;

    /** `Strobe128(string protocol)` — runs the init vector. */
    constructor(protocol: string);
    /**
     * `[JsonConstructor] private Strobe128(byte[] state, StrobeFlags flags, byte beginPosition, byte position)`
     * — restores a dumped state, used for cloning and by the upstream test vectors.
     */
    constructor(dumped: StrobeState);
    constructor(arg: string | StrobeState) {
        const buffer = new ArrayBuffer(STATE_BYTES);
        this._state = new Uint8Array(buffer);
        this._words = new Uint32Array(buffer);

        if (typeof arg !== 'string') {
            if (arg.state.length !== STATE_BYTES) {
                throw new Error(`A Strobe state is ${STATE_BYTES} bytes, got ${arg.state.length}.`);
            }
            this._state.set(arg.state);
            this._position = arg.position;
            this._beginPosition = arg.beginPosition;
            this._currentFlags = arg.currentFlags;

            return;
        }

        if (arg.length === 0) {
            throw new Error('protocol cannot be empty.');
        }

        // F([[1, r/8, 1, 0, 1, 12·8]] || "STROBEv1.0.2")
        const initialState = concat(
            new Uint8Array([1, SPONGE_RATE + 2, 1, 0, 1, 12 * 8]),
            textEncoder.encode('STROBEv1.0.2'),
        );
        this._state.set(initialState, 0);
        keccakP(this._words);
        this.addAssociatedMetaData(textEncoder.encode(arg), false);
    }

    makeCopy(): Strobe128 {
        return new Strobe128(this.dump());
    }

    /** The full serialized state, as the upstream test vectors report it. */
    dump(): StrobeState {
        return {
            state: this._state.slice(),
            position: this._position,
            beginPosition: this._beginPosition,
            currentFlags: this._currentFlags,
        };
    }

    /** Only the sponge bytes, for the Strobe test vectors' `state_after`. */
    dumpState(): Uint8Array {
        return this._state.slice();
    }

    get position() {
        return this._position;
    }

    get beginPosition() {
        return this._beginPosition;
    }

    get currentFlags() {
        return this._currentFlags;
    }

    addAssociatedMetaData(data: Uint8Array, more: boolean) {
        this.beginOperation(StrobeFlags.M | StrobeFlags.A, more);
        this.absorb(data);
    }

    addAssociatedData(data: Uint8Array, more: boolean) {
        this.beginOperation(StrobeFlags.A, more);
        this.absorb(data);
    }

    prf(count: number, more: boolean): Uint8Array {
        this.beginOperation(StrobeFlags.I | StrobeFlags.A | StrobeFlags.C, more);

        return this.squeeze(new Uint8Array(count));
    }

    key(data: Uint8Array, more: boolean) {
        this.beginOperation(StrobeFlags.A | StrobeFlags.C, more);
        this.override(data);
    }

    private absorb(data: Uint8Array) {
        for (const b of data) {
            // The casts are for `noUncheckedIndexedAccess`, which cannot see that
            // `_position` stays below `SPONGE_RATE` because `runF` resets it.
            const at = this._position++;
            this._state[at] = (this._state[at] as number) ^ b;
            if (this._position === SPONGE_RATE) {
                this.runF();
            }
        }
    }

    private override(data: Uint8Array) {
        for (const b of data) {
            this._state[this._position++] = b;
            if (this._position === SPONGE_RATE) {
                this.runF();
            }
        }
    }

    private squeeze(data: Uint8Array) {
        for (let i = 0; i < data.length; i++) {
            data[i] = this._state[this._position] as number;
            this._state[this._position++] = 0;
            if (this._position === SPONGE_RATE) {
                this.runF();
            }
        }

        return data;
    }

    /** Scratch buffer for the two framing bytes `beginOperation` absorbs. */
    private readonly framing = new Uint8Array(2);

    private beginOperation(flags: StrobeFlags, more: boolean) {
        if (more) {
            if (flags !== this._currentFlags) {
                throw new Error(
                    `Attempt to continue operation '${this._currentFlags}' with new flags '${flags}' is not allowed.`,
                );
            }
            this._currentFlags = flags;

            return;
        }

        // Skip adjusting direction information (we just use AD, PRF)
        if ((this._currentFlags & StrobeFlags.T) !== 0) {
            throw new Error('Transport operations are not implemented.');
        }

        const oldBeginPosition = this._beginPosition;
        this._currentFlags = flags;
        this._beginPosition = (this._position + 1) & 0xff;

        this.framing[0] = oldBeginPosition;
        this.framing[1] = flags;
        this.absorb(this.framing);

        // Force running F if C or K is set
        const forceF = (flags & StrobeFlags.C) !== 0 || (flags & StrobeFlags.K) !== 0;

        if (forceF && this._position !== 0) {
            this.runF();
        }
    }

    /** This is the Sponge function responsible for shuffling the internal state. */
    private runF() {
        this._state[this._position] = (this._state[this._position] as number) ^ this._beginPosition;
        this._state[this._position + 1] = (this._state[this._position + 1] as number) ^ D_DATA;
        this._state[SPONGE_RATE + 1] = (this._state[SPONGE_RATE + 1] as number) ^ D_RATE;

        keccakP(this._words);

        this._position = 0;
        this._beginPosition = 0;
    }
}

/** Port of `NWabiSabi/WabiSabi/Crypto/StrobeProtocol/StrobeHasher.cs`. */
export class StrobeHasher {
    private readonly strobe: Strobe128;

    private constructor(domain: string) {
        this.strobe = new Strobe128(WABISABI_PROTOCOL_IDENTIFIER);
        this.appendBytes('domain-separator', textEncoder.encode(domain));
    }

    static create(domain: string) {
        return new StrobeHasher(domain);
    }

    appendBytes(fieldName: string, serializedValue: Uint8Array) {
        this.strobe.addAssociatedMetaData(textEncoder.encode(fieldName), false);
        this.strobe.addAssociatedMetaData(int32ToBytes(serializedValue.length), true);
        this.strobe.addAssociatedData(serializedValue, false);

        return this;
    }

    getHash() {
        return this.strobe.prf(32, false);
    }
}
