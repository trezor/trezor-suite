import { RelayFailure, type RelayMessage, type WardTransition } from '@trezor/ward';

import { type Log } from './logging';
import { reconstructAvailable } from './recoveryReconstruction';
import { normalizeRoot } from './transition';
import { type WardTransitionStore, storeAcceptance } from './transitionStore';
import { type WmClient } from './wm';

type Body = Record<string, unknown>;
type RecoverParams = {
    storage: WardTransitionStore;
    wm: WmClient;
    log: Log;
    params: Body;
    ask: (request: RelayMessage, expect: string) => Promise<Body>;
};
const stringField = (body: Body, key: string): string => {
    if (typeof body[key] !== 'string') throw new RelayFailure('bad_request', `missing ${key}`);

    return body[key];
};
const numberField = (body: Body, key: string): number => {
    if (typeof body[key] !== 'number' || !Number.isSafeInteger(body[key]))
        throw new RelayFailure('bad_request', `invalid ${key}`);

    return body[key];
};

/** Recover only a proved immediate predecessor, with a trusted device confirmation. */
export const recoverWard = async ({
    storage,
    wm,
    log,
    params,
    ask,
}: RecoverParams): Promise<void> => {
    let device = await ask({ name: 'WARDSync', message: {} }, 'WARDSyncAck');
    const wardId = stringField(device, 'ward_id');
    if (device.root_known !== true)
        throw new RelayFailure('device_failure', 'device has no durable trusted root');
    if (params.wardId !== undefined && params.wardId !== wardId)
        throw new RelayFailure('ward_id_mismatch', 'recovery requested another wallet');
    let head = await wm.current(wardId, stringField(device, 'nonce'));
    const history = await wm.history(wardId);
    const rebuilt = await reconstructAvailable({ storage, wardId, head, history, log });
    if (rebuilt.complete)
        throw new RelayFailure('bad_request', 'head is reconstructable; no rollback needed');
    const last = history.find(record => record.counter === head.counter);
    if (
        last?.kind !== 'commit' ||
        rebuilt.counter !== head.counter - 1 ||
        rebuilt.root !== normalizeRoot(last.fromRoot)
    )
        throw new RelayFailure(
            'bad_request',
            'recovery requires the complete immediate predecessor',
        );
    if (numberField(device, 'counter') !== head.counter) {
        const supplied = params.cachedConfirmation;
        if (typeof supplied !== 'object' || supplied === null || Array.isArray(supplied))
            throw new RelayFailure(
                'bad_request',
                'cached WM confirmation required to establish the stuck head',
            );
        const receipt = supplied as Body;
        if (
            receipt.counter !== head.counter ||
            receipt.mac !== head.mac ||
            typeof receipt.wm_signature !== 'string'
        )
            throw new RelayFailure(
                'bad_request',
                'cached confirmation does not name the authoritative head',
            );
        await ask({ name: 'WARDConfirmBatchByWM', message: receipt }, 'WARDConfirmBatchByWMAck');
        log('recovery.cached-confirmation.accepted', { counter: head.counter });
        device = await ask({ name: 'WARDSync', message: {} }, 'WARDSyncAck');
        head = await wm.current(wardId, stringField(device, 'nonce'));
    }
    if (
        numberField(device, 'counter') !== head.counter ||
        normalizeRoot(typeof device.root === 'string' ? device.root : undefined) !== head.root
    )
        throw new RelayFailure('bad_request', 'device does not trust the stuck head');
    // Refresh the nonce-bound head attestation without claiming its missing trie data exists.
    await ask(
        {
            name: 'WARDIngestAttestation',
            message: {
                counter: head.counter,
                mac: head.mac,
                wm_signature: head.signature,
                timestamp: head.timestamp,
            },
        },
        'WARDIngestAttestationAck',
    );
    await ask(
        { name: 'WARDReconcile', message: head.root ? { root: head.root } : {} },
        'WARDReconcileAck',
    );
    // The WM's stored acceptance of the stuck head: the device verifies it and shows when the WM
    // accepted the change it is asked to revert. Without one the screen shows no time.
    const accepted = (await storage.getAcceptances(wardId)).find(
        record => record.counter === head.counter && record.targetRoot === head.root,
    );
    const candidate = await ask(
        {
            name: 'WARDPerformRevert',
            message: {
                stuck_counter: head.counter,
                stuck_root: head.root,
                prev_root: rebuilt.root,
                forward_auth_commit: last.authCommit,
                ...(accepted && {
                    accepted_timestamp: accepted.timestamp,
                    accepted_signature: accepted.wmSignature,
                }),
            },
        },
        'WARDPerformRevertAck',
    );
    const counter = numberField(candidate, 'counter');
    const root = normalizeRoot(
        typeof candidate.new_root === 'string' ? candidate.new_root : undefined,
    );
    if (candidate.ward_id !== wardId || counter !== head.counter + 1 || root !== rebuilt.root)
        throw new RelayFailure('device_failure', 'device returned an unexpected rollback target');
    if (candidate.service_applied === true) {
        log('recovery.complete', { counter, root, restoredCounter: rebuilt.counter });

        return;
    }
    const record: WardTransition = {
        kind: 'revert',
        counter,
        prevRoot: head.root,
        targetRoot: root,
        targetRootMac: stringField(candidate, 'mac'),
        authCommit: stringField(candidate, 'auth_revert'),
        sigCommit: stringField(candidate, 'sig_commit'),
        leaves: [],
    };
    await storage.appendTransition(wardId, record);
    const acceptance = await wm.commit({
        wardId,
        kind: 'revert',
        fromCounter: head.counter,
        fromRoot: head.root,
        counter,
        root,
        mac: record.targetRootMac!,
        authCommit: record.authCommit!,
        signature: record.sigCommit!,
    });
    await storeAcceptance(storage, wardId, record, acceptance, log);
    await ask(
        {
            name: 'WARDConfirmRevertByWM',
            message: {
                counter,
                mac: record.targetRootMac,
                wm_signature: acceptance.signature,
                timestamp: acceptance.timestamp,
            },
        },
        'WARDConfirmRevertByWMAck',
    );
    log('recovery.complete', { counter, root, restoredCounter: rebuilt.counter });
};
