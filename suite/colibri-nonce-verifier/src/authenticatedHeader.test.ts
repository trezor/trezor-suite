import { extractAuthenticatedHeader } from './authenticatedHeader';
import { mockNonceFixture } from '../mocks/mockColibriFixtures';

const ADDRESS = mockNonceFixture.address;

// Shape of `decodeProof` output for an account proof with the full consensus-layer header proof.
const decodedWithHeader = (elHeader: string) => ({
    version: '0x00010100',
    data: null,
    proof: {
        accountProof: [],
        address: ADDRESS.toLowerCase(),
        storageProof: [],
        elProof: { elHeader, clHeader: { slot: '0x1' }, blockhashBranch: [], gindex: '0x32c' },
    },
    sync_data: null,
});

// A minimal 20-field header whose stateRoot, number and timestamp are recognizable.
const encodeHeader = () => {
    const field = (bytes: number[]) =>
        bytes.length === 1 && bytes[0]! < 0x80 ? bytes : [0x80 + bytes.length, ...bytes];
    const fields = [
        ...Array.from({ length: 3 }, () => field(Array(32).fill(0x11))),
        field(Array(32).fill(0xaa)), // stateRoot
        ...Array.from({ length: 4 }, () => field([0x01])),
        field([0x01, 0x52, 0xb0, 0x67]), // number 22196327
        field([0x01]),
        field([0x01]),
        field([0x67, 0xef, 0xf4, 0xc7]), // timestamp 1743779015
        ...Array.from({ length: 8 }, () => field([0x01])),
    ].flat();

    return `0x${[0xf8, fields.length, ...fields].map(byte => byte.toString(16).padStart(2, '0')).join('')}`;
};

describe('extractAuthenticatedHeader', () => {
    it('reads block number, timestamp, state root and hash from the RLP header', () => {
        const result = extractAuthenticatedHeader(decodedWithHeader(encodeHeader()), ADDRESS);

        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.header.blockNumber).toBe(22196327n);
        expect(result.header.timestampSeconds).toBe(1743779015n);
        expect(result.header.stateRoot).toBe(`0x${'aa'.repeat(32)}`);
        expect(result.header.blockHash).toMatch(/^0x[0-9a-f]{64}$/);
    });

    it('treats a cached header reference as unavailable metadata', () => {
        const decoded = decodedWithHeader(encodeHeader());
        decoded.proof.elProof = `0x${'22'.repeat(32)}` as never;

        expect(extractAuthenticatedHeader(decoded, ADDRESS)).toEqual({
            success: false,
            code: 'METADATA_UNAVAILABLE',
            detail: 'cached header reference',
        });
    });

    it('rejects a proof for another address', () => {
        const result = extractAuthenticatedHeader(
            decodedWithHeader(encodeHeader()),
            '0x0000000000000000000000000000000000000001',
        );

        expect(result).toEqual({
            success: false,
            code: 'VERIFICATION_FAILED',
            detail: 'address mismatch',
        });
    });

    it('rejects malformed headers and undecodable proofs', () => {
        expect(extractAuthenticatedHeader(decodedWithHeader('0xc0'), ADDRESS).success).toBe(false);
        expect(extractAuthenticatedHeader(decodedWithHeader('nope'), ADDRESS).success).toBe(false);
        expect(extractAuthenticatedHeader(null, ADDRESS).success).toBe(false);
        expect(extractAuthenticatedHeader({ proof: 1 }, ADDRESS).success).toBe(false);
    });
});
