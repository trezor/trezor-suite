import {
    computeMerkleRoot,
    entryToValueBytes,
    evaluateProof,
    generateMerkleProof,
    generateNonMembershipProof,
} from '../proof';

// Golden vectors captured from the pre-port connect-cli implementation
// (Node's `crypto`/`Buffer`), to prove the @noble/hashes port is byte-identical.
const rows = [
    { address: 'bc1qaddr1', networkSymbol: 'btc', entry: { metadata: { label: 'a' }, counter: 1 } },
    { address: 'bc1qaddr2', networkSymbol: 'btc', entry: { metadata: { label: 'b' }, counter: 2 } },
    { address: 'bc1qaddr3', networkSymbol: 'btc', entry: { metadata: {}, counter: 1 } },
];

// Recomputed after the strict-counter change: the counter is committed only in the
// leaf's 4-byte field (sha256(0x00||address||counter(4B BE)||value)); the value bytes
// are now counter-free (entryToValueBytes = networkSymbol + sorted metadata).
const EXPECTED_ROOT = '91e5817041b7b5fd37f0abf949c5be4b312ffc8a0d5aa2374c78d71bf5477cd0';
const EXPECTED_PROOF = [
    '05c882f2eb5bb8ce704da4bdb0217f2dd8fba6d69193a3cf1ae6dbdd0576c87040',
    '00cc3a6acd812a2fb093d26d813301e0d3a169695de2a7a7998b221d7424758bd3',
];

describe('generateMerkleProof / computeMerkleRoot', () => {
    it('matches golden vectors from the pre-port implementation', () => {
        expect(computeMerkleRoot(rows)).toBe(EXPECTED_ROOT);
        expect(generateMerkleProof(rows, 'bc1qaddr2', 'btc')).toEqual(EXPECTED_PROOF);
    });

    it('returns an empty proof for an unknown address', () => {
        expect(generateMerkleProof(rows, 'bc1qunknown', 'btc')).toEqual([]);
    });

    it('returns an empty root for an empty tree', () => {
        expect(computeMerkleRoot([])).toBe('');
    });
});

describe('evaluateProof', () => {
    it('reconstructs the root from a membership proof (round-trip)', () => {
        const proof = generateMerkleProof(rows, 'bc1qaddr2', 'btc');
        const root = evaluateProof('bc1qaddr2', 'btc', rows[1]!.entry, proof);

        expect(root).toBe(computeMerkleRoot(rows));
    });

    it('round-trips for every entry in the tree', () => {
        rows.forEach(row => {
            const proof = generateMerkleProof(rows, row.address, row.networkSymbol);

            expect(evaluateProof(row.address, row.networkSymbol, row.entry, proof)).toBe(
                computeMerkleRoot(rows),
            );
        });
    });
});

describe('generateNonMembershipProof', () => {
    it('returns a witness leaf and a proof that reconstructs the root', () => {
        const result = generateNonMembershipProof(rows, 'bc1qmissing', 'btc');

        expect(result.witnessAddress).not.toBeNull();
        expect(result.proof.length).toBeGreaterThan(0);

        const witnessRow = rows.find(r => r.address === result.witnessAddress)!;
        const root = evaluateProof(
            witnessRow.address,
            witnessRow.networkSymbol,
            witnessRow.entry,
            result.proof,
        );

        expect(root).toBe(computeMerkleRoot(rows));
        expect(result.witnessValue).toEqual(
            entryToValueBytes(witnessRow.networkSymbol, witnessRow.entry),
        );
    });

    it('returns nulls for an empty tree', () => {
        const result = generateNonMembershipProof([], 'bc1qmissing', 'btc');

        expect(result).toEqual({
            proof: [],
            witnessAddress: null,
            witnessValue: null,
            witnessCounter: null,
        });
    });
});

describe('entryToValueBytes', () => {
    it('sorts metadata keys deterministically regardless of input order', () => {
        const a = entryToValueBytes('btc', { metadata: { label: 'x', data: 1 }, counter: 1 });
        const b = entryToValueBytes('btc', { metadata: { data: 1, label: 'x' }, counter: 1 });

        expect(a).toEqual(b);
    });
});
