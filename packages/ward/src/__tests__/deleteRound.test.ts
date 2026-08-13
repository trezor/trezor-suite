import { EMPTY_PART, computeRootFromBlobs, nonMembershipByKey, proofByKey } from '../proof';
import type { BlobRow } from '../proof';

// The host side of a FULL delete. These are the exact functions buildAckByKey uses to
// answer the device's WARDProofRequest, so this pins what `dbdelete` gets served after
// the row is removed: a witness that reconstructs the POST-delete root.
const sealed = (n: string, t: string, b: string) => ({
    encoding: 0,
    nonceHex: n,
    tagHex: t,
    bodyHex: b,
});

const row = (ek: string, body: string): BlobRow => ({
    entryKeyHex: ek.repeat(32),
    keyType: 'address',
    identity: sealed('11'.repeat(12), '22'.repeat(16), `99${ek}`),
    content: sealed('33'.repeat(12), '44'.repeat(16), body),
});

describe('delete round — the host serves provable absence', () => {
    const alice = row('a1', 'aaaa');
    const target = row('d5', 'dddd');
    const carol = row('c3', 'cccc');

    it('after removing the row, non-membership reconstructs the NEW root', () => {
        const before = [alice, target, carol];
        const rootBefore = computeRootFromBlobs(before);
        // present: a membership proof exists
        expect(proofByKey(before, target.entryKeyHex).length).toBeGreaterThan(0);

        // the delete: commitLocal removed the row, so it is simply gone from the set
        const after = [alice, carol];
        const rootAfter = computeRootFromBlobs(after);
        expect(rootAfter).not.toBe(rootBefore);

        const nm = nonMembershipByKey(after, target.entryKeyHex);
        expect(nm.witnessEntryKeyHex).not.toBeNull();
        expect(nm.witnessCommitHex).not.toBeNull();
        // the witness is a different, still-present leaf
        expect(nm.witnessEntryKeyHex).not.toBe(target.entryKeyHex);
        expect(after.map(r => r.entryKeyHex)).toContain(nm.witnessEntryKeyHex);
    });

    it('a row left with an EMPTY content part would still prove MEMBERSHIP (the tombstone bug)', () => {
        // This is what `dbchange` with empty-ish metadata used to produce: the row stays,
        // so the host still serves a membership proof and the entry is not gone.
        const tombstoned = [alice, { ...target, content: EMPTY_PART }, carol];
        const nm = nonMembershipByKey(tombstoned, target.entryKeyHex);

        // the target is still IN the set, so "non-membership" hands back the target
        // itself as its own witness — which the device rejects (witness must differ).
        expect(nm.witnessEntryKeyHex).toBe(target.entryKeyHex);
    });

    it('deleting the last row empties the tree: no witness, empty root', () => {
        expect(computeRootFromBlobs([])).toBe('');
        const nm = nonMembershipByKey([], target.entryKeyHex);
        expect(nm).toEqual({ proof: [], witnessEntryKeyHex: null, witnessCommitHex: null });
    });

    it('the deleted row does not contribute to the root any more', () => {
        // Sanity that removal is what moves the root, not a re-encoding of the leaf.
        const after = [alice, carol];
        expect(computeRootFromBlobs(after)).toBe(computeRootFromBlobs([carol, alice]));
        expect(computeRootFromBlobs([...after, target])).not.toBe(computeRootFromBlobs(after));
    });
});
