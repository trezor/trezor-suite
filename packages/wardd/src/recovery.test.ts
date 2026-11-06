import {
    InMemoryWardDb,
    type WardLeafBlob,
    type WardTransition,
    computeRootFromBlobs,
} from '@trezor/ward';

import { recoverWard } from './recovery';
import { reconstructAvailable } from './recoveryReconstruction';
import { type SignedTransition } from './transition';
import { type WmClient } from './wm';
import { mockTransition } from '../mocks/mockTransition';

const leaf = (key: string): WardLeafBlob => ({
    entryKey: key.repeat(32),
    keyType: 'address',
    identity: { encoding: 0, nonceHex: '01'.repeat(12), tagHex: '02'.repeat(16), bodyHex: 'aa' },
    content: { encoding: 0, nonceHex: '03'.repeat(12), tagHex: '04'.repeat(16), bodyHex: key },
});
const firstLeaf = leaf('11');
const secondLeaf = leaf('22');
const rootOf = (...leaves: WardLeafBlob[]) =>
    computeRootFromBlobs(leaves.map(item => ({ ...item, entryKeyHex: item.entryKey })));
const one = mockTransition({ root: rootOf(firstLeaf) });
const two = mockTransition({
    fromCounter: 1,
    fromRoot: one.root,
    counter: 2,
    root: rootOf(firstLeaf, secondLeaf),
});
const undo = mockTransition({
    kind: 'revert',
    fromCounter: 2,
    fromRoot: two.root,
    counter: 3,
    root: one.root,
});
const stored = (record: SignedTransition, leaves: WardLeafBlob[]): WardTransition => ({
    kind: record.kind,
    counter: record.counter,
    prevRoot: record.fromRoot,
    targetRoot: record.root,
    targetRootMac: record.mac,
    authCommit: record.authCommit,
    sigCommit: record.signature,
    headNonce: record.headNonce,
    leaves,
});
const setup = () => {
    const storage = new InMemoryWardDb();
    storage.appendTransition(one.wardId, stored(one, [firstLeaf]));
    const log = jest.fn();
    const rebuild = (history: SignedTransition[]) =>
        reconstructAvailable({
            storage,
            wardId: one.wardId,
            head: { counter: history.at(-1)!.counter, root: history.at(-1)!.root },
            history,
            log,
        });

    return { storage, log, rebuild };
};

it('returns only the verified prefix when a published leaf record is missing', async () => {
    const { rebuild } = setup();
    await expect(rebuild([one, two])).resolves.toMatchObject({
        complete: false,
        counter: 1,
        root: one.root,
        missingCounter: 2,
    });
});

it('walks back from WM then rebuilds the reverted root without the lost leaf', async () => {
    const { rebuild, log } = setup();
    const result = await rebuild([one, two, undo]);
    expect(result).toMatchObject({ complete: true, counter: 3, root: one.root });
    expect(result.blobs.map(item => item.entryKeyHex)).toEqual([firstLeaf.entryKey]);
    expect(
        log.mock.calls
            .filter(call => call[0] === 'trie.transition')
            .map(call => JSON.parse(call[1]).counter),
    ).toEqual([3, 2, 1]);
    expect(log.mock.calls.findIndex(call => call[0] === 'trie.lineage')).toBeLessThan(
        log.mock.calls.findIndex(call => call[0] === 'trie.replay'),
    );
    expect(
        log.mock.calls
            .filter(call => call[0] === 'trie.replay.history-step')
            .map(call => call[1].counter),
    ).toEqual([1, 2, 3]);
    expect(log).toHaveBeenCalledWith(
        'trie.rebuild.complete',
        expect.objectContaining({ matches: true, freshReconstruction: true }),
    );
});

it('reconstructs from storage instead of reusing a previous successful snapshot', async () => {
    const { storage, rebuild } = setup();
    expect((await rebuild([one, two, undo])).complete).toBe(true);
    storage.getTransitions = () => [];
    await expect(rebuild([one, two, undo])).resolves.toMatchObject({
        complete: false,
        counter: 0,
        missingCounter: 1,
    });
});

it('does not trust damaged surviving leaf contents', async () => {
    const { storage, rebuild } = setup();
    const original = storage.getTransitions.bind(storage);
    storage.getTransitions = wardId =>
        original(wardId).map(item => ({ ...item, leaves: [secondLeaf] }));
    await expect(rebuild([one, two, undo])).resolves.toMatchObject({
        complete: false,
        counter: 0,
        root: '',
    });
});

it('rejects missing, forged and unrelated rollback history', async () => {
    const { rebuild } = setup();
    await expect(rebuild([one, undo])).rejects.toThrow('contiguous');
    await expect(rebuild([one, two, { ...undo, signature: '00'.repeat(64) }])).rejects.toThrow(
        'signature',
    );
    await expect(rebuild([one, two, mockTransition({ ...undo, root: '' })])).rejects.toThrow(
        'immediate predecessor',
    );
});

it('allows new publications after a rollback with missing historical data', async () => {
    const { storage, rebuild } = setup();
    const nextLeaf = leaf('33');
    const next = mockTransition({
        fromCounter: 3,
        fromRoot: one.root,
        counter: 4,
        root: rootOf(firstLeaf, nextLeaf),
    });
    storage.appendTransition(one.wardId, stored(next, [nextLeaf]));
    await expect(rebuild([one, two, undo, next])).resolves.toMatchObject({
        complete: true,
        counter: 4,
        root: next.root,
    });
});

it.each(['cancel', 'storage'])('does not publish a rollback after a %s failure', async failure => {
    const { storage } = setup();
    const commit = jest.fn();
    const wm: WmClient = {
        current: jest.fn().mockResolvedValue({
            counter: 2,
            root: two.root,
            mac: two.mac,
            timestamp: 1700000000,
            headNonce: two.headNonce,
            signature: 'signed',
        }),
        history: jest.fn().mockResolvedValue([one, two]),
        commit,
        attest: jest.fn(),
    };
    const ask = jest.fn().mockImplementation(request => {
        if (request.name === 'WARDSync')
            return Promise.resolve({
                ward_id: one.wardId,
                root_known: true,
                counter: 2,
                root: two.root,
                nonce: 'ab'.repeat(32),
            });
        if (request.name === 'WARDPerformRevert') {
            if (failure === 'cancel') return Promise.reject(new Error('cancelled'));

            return Promise.resolve({
                counter: 3,
                ward_id: one.wardId,
                from_root: two.root,
                new_root: one.root,
                mac: undo.mac,
                auth_revert: undo.authCommit,
                sig_commit: undo.signature,
            });
        }

        return Promise.resolve({});
    });
    if (failure === 'storage')
        storage.appendTransition = () => {
            throw new Error('disk full');
        };
    await expect(recoverWard({ storage, wm, log: jest.fn(), params: {}, ask })).rejects.toThrow(
        failure === 'cancel' ? 'cancelled' : 'disk full',
    );
    expect(commit).not.toHaveBeenCalled();
    expect(ask.mock.calls.map(call => call[0].name)).not.toContain('WARDConfirmRevertByWM');
});

it('refuses recovery from an incomplete durable device anchor', async () => {
    const { storage } = setup();
    const current = jest.fn();
    const wm: WmClient = { current, history: jest.fn(), commit: jest.fn(), attest: jest.fn() };
    const ask = jest
        .fn()
        .mockResolvedValue({ ward_id: one.wardId, counter: 2, root: two.root, root_known: false });
    await expect(recoverWard({ storage, wm, log: jest.fn(), params: {}, ask })).rejects.toThrow(
        'durable trusted root',
    );
    expect(current).not.toHaveBeenCalled();
    expect(ask).toHaveBeenCalledTimes(1);
});
