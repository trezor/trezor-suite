import { type BlobRow, InMemoryWardDb, type RelayDevice, computeRootFromBlobs } from '@trezor/ward';

import { rebuildTrie } from './reconstruction';
import { Wardd } from './service';
import { MockWm } from './wm';

const wardId = 'cd'.repeat(32);
const part = (bodyHex: string) => ({
    encoding: 0,
    nonceHex: '01'.repeat(12),
    tagHex: '02'.repeat(16),
    bodyHex,
});
const blob: BlobRow = {
    entryKeyHex: '11'.repeat(32),
    keyType: 'address',
    identity: part('aabb'),
    content: part('ccdd'),
};
const root = computeRootFromBlobs([blob]);

const replica = () => {
    const storage = new InMemoryWardDb();
    storage.setTreeState(wardId, { counter: 1, root });
    storage.appendTransition(wardId, {
        counter: 1,
        prevRoot: '',
        targetRoot: root,
        leaves: [
            {
                entryKey: blob.entryKeyHex,
                keyType: blob.keyType,
                identity: blob.identity,
                content: blob.content,
            },
        ],
    });

    return storage;
};

it('rebuilds from history even when the current-entry cache is empty and logs every stage', async () => {
    const storage = replica();
    const logs: unknown[][] = [];
    expect(
        await rebuildTrie(storage, wardId, storage.getTreeState(wardId), (...messages) =>
            logs.push(messages),
        ),
    ).toEqual([blob]);
    expect(storage.getAllEntries(wardId)).toEqual([]);
    expect(logs.map(line => line[0])).toEqual(
        expect.arrayContaining([
            'trie.head',
            'trie.lineage',
            'trie.transition',
            'trie.genesis',
            'trie.replay',
            'trie.replay.step',
            'trie.entry',
            'trie.rebuild.start',
            'trie.rebuild.complete',
        ]),
    );
    const transition = JSON.parse(logs.find(line => line[0] === 'trie.transition')?.[1] as string);
    expect(transition).toMatchObject({ counter: 1, prevRoot: 'EMPTY', targetRoot: root });
    const entry = JSON.parse(logs.find(line => line[0] === 'trie.entry')?.[1] as string);
    expect(entry).toMatchObject(blob);
});

it('logs the exact proof acknowledgement returned to the HWI', async () => {
    const logs: unknown[][] = [];
    const endpoint = await new Wardd({
        storage: replica(),
        wm: new MockWm(),
        log: (...messages) => logs.push(messages),
    }).connect();
    const device: RelayDevice = async request => {
        await Promise.resolve();
        if (request.name === 'WARDSync')
            return { name: 'WARDSyncAck', message: { ward_id: wardId, nonce: 'ab'.repeat(32) } };
        if (request.name === 'WARDIngestAttestation')
            return { name: 'WARDIngestAttestationAck', message: { counter: 1 } };

        return { name: 'WARDReconcileAck', message: { counter: 1, new_root: root } };
    };
    await endpoint.call('sync', {}, device);
    const ack = await endpoint.call('answerProofRequest', {
        request: { entry_key: blob.entryKeyHex },
    });
    const logged = JSON.parse(logs.find(line => line[0] === 'proof.outgoing')?.[1] as string);
    expect(logged.name).toBe('WARDProofAck');
    expect(logged.message).toEqual(ack);
    expect(logged.message.content.encrypted.ct).toBe('ccdd');
});

it('rejects incomplete history before sending its checkpoint to the device', async () => {
    const storage = new InMemoryWardDb();
    storage.setTreeState(wardId, { counter: 1, root });
    const endpoint = await new Wardd({ storage, wm: new MockWm() }).connect();
    const sent: string[] = [];
    const device: RelayDevice = async request => {
        await Promise.resolve();
        sent.push(request.name);

        return { name: 'WARDSyncAck', message: { ward_id: wardId, nonce: 'ab'.repeat(32) } };
    };
    await expect(endpoint.call('sync', {}, device)).rejects.toThrow('lineage incomplete');
    expect(sent).toEqual(['WARDSync']);
});
