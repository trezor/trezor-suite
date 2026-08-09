import { schnorr } from '@noble/curves/secp256k1.js';

import {
    ATTESTATION_KIND,
    type Attestation,
    assertAttestableAddress,
    attestationContent,
    attestationEventId,
    decodeAttestation,
    encodeAttestation,
    verifyAttestation,
} from './attestation';
import { bytesToHex, hexToBytes } from './npub';

// A deterministic "device": the same BIP-340 primitive the firmware uses.
const SECRET = hexToBytes('11'.repeat(32));
const NPUB = bytesToHex(schnorr.getPublicKey(SECRET));

const ADDRESS = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx';
const SLIP44 = 1;
const CREATED_AT = 1_700_000_000;

const sign = (overrides: Partial<Attestation> = {}): Attestation => {
    const base = {
        npub: NPUB,
        address: ADDRESS,
        slip44: SLIP44,
        createdAt: CREATED_AT,
        kind: ATTESTATION_KIND,
    };
    const eventId = attestationEventId(base);

    return {
        ...base,
        eventId,
        signature: bytesToHex(schnorr.sign(hexToBytes(eventId), SECRET)),
        ...overrides,
    };
};

describe('attestation content', () => {
    it('binds the network into the signed content', () => {
        expect(attestationContent(1, ADDRESS)).toBe(`1:${ADDRESS}`);
        // a testnet attestation must not be reusable as mainnet
        expect(attestationContent(0, ADDRESS)).not.toBe(attestationContent(1, ADDRESS));
    });

    it('rejects addresses outside the firmware-checked charset', () => {
        expect(() => assertAttestableAddress(ADDRESS)).not.toThrow();
        expect(() => assertAttestableAddress('bc1q"escape')).toThrow();
        expect(() => assertAttestableAddress('')).toThrow();
        expect(() => assertAttestableAddress('a'.repeat(91))).toThrow();
    });
});

describe('verifyAttestation', () => {
    it('accepts a genuine attestation', () => {
        expect(verifyAttestation(sign(), NPUB)).toBe(true);
    });

    it('rejects one signed by a different wallet', () => {
        const otherNpub = bytesToHex(schnorr.getPublicKey(hexToBytes('22'.repeat(32))));
        expect(verifyAttestation(sign(), otherNpub)).toBe(false);
    });

    it('rejects a tampered address', () => {
        const a = sign();
        expect(verifyAttestation({ ...a, address: `${a.address.slice(0, -1)}y` }, NPUB)).toBe(
            false,
        );
    });

    it('rejects a tampered signature', () => {
        const a = sign();
        expect(verifyAttestation({ ...a, signature: `00${a.signature.slice(2)}` }, NPUB)).toBe(
            false,
        );
    });

    it('rejects a swapped network (replay across chains)', () => {
        const a = sign();
        expect(verifyAttestation({ ...a, slip44: 0 }, NPUB)).toBe(false);
    });

    it('rejects an event id that does not cover the claimed content', () => {
        const a = sign();
        expect(verifyAttestation({ ...a, eventId: '00'.repeat(32) }, NPUB)).toBe(false);
    });

    it('rejects the wrong event kind', () => {
        expect(verifyAttestation(sign({ kind: 1 }), NPUB)).toBe(false);
    });

    it('never throws on malformed input', () => {
        const a = sign();
        expect(verifyAttestation({ ...a, signature: 'nope' }, NPUB)).toBe(false);
        expect(verifyAttestation({ ...a, slip44: -1 }, NPUB)).toBe(false);
        expect(verifyAttestation({ ...a, npub: 'zz' }, NPUB)).toBe(false);
    });
});

describe('attestation transport encoding', () => {
    it('round-trips', () => {
        const a = sign();
        const decoded = decodeAttestation(encodeAttestation(a));
        expect(decoded).toEqual(a);
        expect(verifyAttestation(decoded!, NPUB)).toBe(true);
    });

    it('returns null for junk rather than throwing', () => {
        expect(decodeAttestation('not json')).toBeNull();
        expect(decodeAttestation('{"npub":1}')).toBeNull();
        expect(decodeAttestation('null')).toBeNull();
    });
});
