import {
    computeMerkleRoot,
    entryToValueBytes,
    evaluateProof,
    generateMerkleProof,
    generateNonMembershipProof,
} from '../merkleTree';

// Golden vectors captured from the pre-port connect-cli implementation
// (Node's `crypto`/`Buffer`), to prove the @noble/hashes port is byte-identical.
const rows = [
    { address: 'bc1qaddr1', networkSymbol: 'btc', entry: { metadata: { label: 'a' }, counter: 1 } },
    { address: 'bc1qaddr2', networkSymbol: 'btc', entry: { metadata: { label: 'b' }, counter: 2 } },
    { address: 'bc1qaddr3', networkSymbol: 'btc', entry: { metadata: {}, counter: 1 } },
];

const EXPECTED_ROOT = '15a28bf6a14c4122c73fa7755f7d343aa9c15947a60659eeefbda16e0223e7b6';
const EXPECTED_PROOF = [
    '05d49ed485b1256e346f0d489c1950d7289be53cd86e6fdf6f4fa4f271ba712830',
    '005cf93d0d523d44ce47b29a7c4ecd9a71f30ceddd320d36054a2e040a64e434c4',
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

        expect(result).toEqual({ proof: [], witnessAddress: null, witnessValue: null });
    });
});

describe('entryToValueBytes', () => {
    it('sorts metadata keys deterministically regardless of input order', () => {
        const a = entryToValueBytes('btc', { metadata: { label: 'x', data: 1 }, counter: 1 });
        const b = entryToValueBytes('btc', { metadata: { data: 1, label: 'x' }, counter: 1 });

        expect(a).toEqual(b);
    });
});
