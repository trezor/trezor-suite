import { bytesToHex } from '@noble/hashes/utils.js';

import {
    computeMerkleRoot,
    entryKey,
    entryToValueBytes,
    evaluateProof,
    generateMerkleProof,
    generateNonMembershipProof,
} from '../proof';

// Golden vectors verified byte-for-byte against the Python reference tree
// (trezorlib.authdb_tree) — the load-bearing cross-implementation invariant.
const rows = [
    {
        appId: 'bitcoin',
        address: 'bc1qaddr1',
        networkSymbol: 'btc',
        entry: { metadata: { label: 'a' }, counter: 1 },
    },
    {
        appId: 'bitcoin',
        address: 'bc1qaddr2',
        networkSymbol: 'btc',
        entry: { metadata: { label: 'b' }, counter: 2 },
    },
    {
        appId: 'bitcoin',
        address: 'bc1qaddr3',
        networkSymbol: 'btc',
        entry: { metadata: {}, counter: 1 },
    },
];

// Domain-separated, two-level leaf model:
//   entry_key  = sha256(appId || 0x00 || "address" || 0x00 || address)
//   value_hash = sha256(counter(4B BE) || value)
//   leaf_hash  = sha256(0x00 || entry_key || value_hash)
const EXPECTED_ROOT = '9c1d7de22dba0437d7e67dfa85f1379b6f0780e4b3888a9084c54f3f449117ba';
const EXPECTED_PROOF = [
    '00fe0acadea7a65bc7c61a0d4d339d0fbd9bb932de3cea9698bc35c87f341949a1',
    '0154cc76b06f5fb19a9616c2ada74d3ec42fe4a74fad7ad6820670df51ae07bacd',
];

describe('generateMerkleProof / computeMerkleRoot', () => {
    it('matches golden vectors (byte-identical to the Python reference)', () => {
        expect(computeMerkleRoot(rows)).toBe(EXPECTED_ROOT);
        expect(generateMerkleProof(rows, 'bitcoin', 'bc1qaddr2', 'btc')).toEqual(EXPECTED_PROOF);
    });

    it('returns an empty proof for an unknown address', () => {
        expect(generateMerkleProof(rows, 'bitcoin', 'bc1qunknown', 'btc')).toEqual([]);
    });

    it('domain-separates: the same address in another app is a different (absent) leaf', () => {
        // 'bc1qaddr2' exists in the 'bitcoin' domain but not in 'ethereum'.
        expect(generateMerkleProof(rows, 'ethereum', 'bc1qaddr2', 'btc')).toEqual([]);
    });

    it('returns an empty root for an empty tree', () => {
        expect(computeMerkleRoot([])).toBe('');
    });
});

describe('evaluateProof', () => {
    it('reconstructs the root from a membership proof (round-trip)', () => {
        const proof = generateMerkleProof(rows, 'bitcoin', 'bc1qaddr2', 'btc');
        const root = evaluateProof('bitcoin', 'bc1qaddr2', 'btc', rows[1]!.entry, proof);

        expect(root).toBe(computeMerkleRoot(rows));
    });

    it('round-trips for every entry in the tree', () => {
        rows.forEach(row => {
            const proof = generateMerkleProof(rows, row.appId, row.address, row.networkSymbol);

            expect(evaluateProof(row.appId, row.address, row.networkSymbol, row.entry, proof)).toBe(
                computeMerkleRoot(rows),
            );
        });
    });

    it('a membership proof from one domain does not verify under another', () => {
        const proof = generateMerkleProof(rows, 'bitcoin', 'bc1qaddr2', 'btc');
        // Same address+value+proof, wrong domain → different entry_key → wrong root.
        expect(evaluateProof('ethereum', 'bc1qaddr2', 'btc', rows[1]!.entry, proof)).not.toBe(
            computeMerkleRoot(rows),
        );
    });
});

describe('generateNonMembershipProof', () => {
    it('returns a two-hash witness and a proof that reconstructs the root', () => {
        const result = generateNonMembershipProof(rows, 'bitcoin', 'bc1qmissing', 'btc');

        expect(result.witnessEntryKey).not.toBeNull();
        expect(result.witnessValueHash).not.toBeNull();
        expect(result.proof.length).toBeGreaterThan(0);

        // Locate the witness row by matching its entry_key (the witness may be any
        // neighbour on the path), then confirm its membership proof reconstructs the root.
        const witnessRow = rows.find(
            r => bytesToHex(entryKey(r.appId, r.address)) === result.witnessEntryKey,
        )!;
        const root = evaluateProof(
            witnessRow.appId,
            witnessRow.address,
            witnessRow.networkSymbol,
            witnessRow.entry,
            result.proof,
        );

        expect(root).toBe(computeMerkleRoot(rows));
    });

    it('returns nulls for an empty tree', () => {
        const result = generateNonMembershipProof([], 'bitcoin', 'bc1qmissing', 'btc');

        expect(result).toEqual({
            proof: [],
            witnessEntryKey: null,
            witnessValueHash: null,
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
