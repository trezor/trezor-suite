import { toBytes, toHex } from '../bytes';
import { applyResult, serveChain, serveEntry, storeIsAt } from '../serve';
import { WardTrie } from '../store';
import { EMPTY_ROOT, commitOf, insertRoot, leafHash, updateRoot, verifyMembership } from '../trie';

const key = (b: number) => new Uint8Array(32).fill(b);
const part = (body: string) => ({
    encoding: 0,
    encrypted: { nonce: '6e'.repeat(12), tag: '74'.repeat(16), ct: body },
});
const leafOf = (body: string) => ({
    identity: { ...part('6964'), key_type: 'address' },
    content: part(body),
});

describe('serveEntry', () => {
    it('proves each batched change against the running root, via the staged leaves', () => {
        const store = new WardTrie();
        store.set(key(1), leafOf('01'));
        store.set(key(2), leafOf('02'));
        let running = store.rootOrEmpty();
        const staged: [Uint8Array, Uint8Array][] = [];
        for (const [k, body] of [
            [key(3), '03'],
            [key(1), '11'],
            [key(4), '04'],
        ] as const) {
            const ack = serveEntry(store, { entry_key: toHex(k) }, staged);
            const proof = ack.proof.map(toBytes);
            const newCommit = commitOf('address', leafOf(body).identity, leafOf(body).content);
            running = ack.content
                ? updateRoot(
                      k,
                      commitOf('address', ack.identity, ack.content),
                      newCommit,
                      proof,
                      running,
                  )
                : insertRoot(
                      k,
                      newCommit,
                      proof,
                      running,
                      toBytes(ack.witness_entry_key!),
                      toBytes(ack.witness_commit!),
                  );
            staged.push([k, newCommit]);
        }
        // the store itself is untouched until the batch is applied...
        expect(store.rootOrEmpty()).not.toEqual(running);
        // ...and applying it reaches exactly the running root the "device" derived
        applyResult(store, {
            counter: 3,
            from_counter: 0,
            auth_commit: '6d'.repeat(32),
            wm_sig: '73'.repeat(64),
            leaves: [
                { entry_key: toHex(key(3)), ...leafOf('03') },
                { entry_key: toHex(key(1)), ...leafOf('11') },
                { entry_key: toHex(key(4)), ...leafOf('04') },
            ],
        });
        expect(store.rootOrEmpty()).toEqual(running);
        expect(store.links).toHaveLength(1);
        expect(store.links[0]).toMatchObject({ fromCounter: 0, toCounter: 3, operation: 'commit' });
        expect(storeIsAt(store, 3, toHex(running))).toBe(true);
    });

    it('answers a present key with its leaf and a membership proof', () => {
        const store = new WardTrie();
        store.set(key(9), leafOf('09'));
        const ack = serveEntry(store, { entry_key: toHex(key(9)) });
        expect(ack.content).toEqual(leafOf('09').content);
        expect(
            verifyMembership(
                key(9),
                store.commit(key(9)),
                ack.proof.map(toBytes),
                store.rootOrEmpty(),
            ),
        ).toBe(true);
    });
});

describe('applyResult and serveChain', () => {
    it('records ONE link per write, and serves them back newest first', () => {
        const store = new WardTrie();
        applyResult(store, {
            entry_key: toHex(key(1)),
            ...leafOf('01'),
            counter: 1,
            auth_commit: 'aa'.repeat(32),
        });
        applyResult(store, {
            entry_key: toHex(key(2)),
            ...leafOf('02'),
            counter: 2,
            auth_commit: 'bb'.repeat(32),
        });
        const chain = serveChain(store, 2, store.root());
        expect(chain.map(l => l.to_counter)).toEqual([2, 1]);
        expect(chain[1]).not.toHaveProperty('from_root'); // the empty tree travels as absent
        expect(chain[0]!.auth_commit).toBe('bb'.repeat(32));
    });

    it('refuses a batch that does not start at the store counter', () => {
        const store = new WardTrie();
        expect(() =>
            applyResult(store, {
                counter: 9,
                from_counter: 7,
                auth_commit: 'cc'.repeat(32),
                leaves: [{ entry_key: toHex(key(1)), ...leafOf('01') }],
            }),
        ).toThrow('starts at counter 7');
    });

    it('treats a result with no authorisation as no transition', () => {
        const store = new WardTrie();
        applyResult(store, { entry_key: toHex(key(1)), counter: 0 });
        expect(store.links).toHaveLength(0);
        expect(leafHash(key(1), new Uint8Array(32))).toHaveLength(32);
        expect(store.rootOrEmpty()).toEqual(EMPTY_ROOT);
    });
});
