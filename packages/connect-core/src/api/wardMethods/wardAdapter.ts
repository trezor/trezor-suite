/**
 * The WARD adapter: Connect's whole part in WARD. wardd (given in-process through the `wardd`
 * setting) holds every flow, proof, store and WM call; this only does what only Connect can --
 * put wardd's messages on THIS device session and hand back the device's answers.
 *
 * Two hooks, the same in every host library (HWI has the twin in trezorlib `ward_relay`):
 *
 *   relay             wardd's next deviceCall -> the device -> its final answer back to wardd
 *   onProofRequest    the device's mid-call WARDProofRequest -> wardd `answerProofRequest` -> WARDProofAck
 *
 * NO WARD LOGIC HERE: which message comes next, what a reply means, and what to store are wardd's.
 */
import { ERRORS } from '@trezor/connect-common/src/constants';
import type { MessagesSchema } from '@trezor/protobuf';
import {
    type RelayDevice,
    RelayFailure,
    type RelayMessage,
    type RelayMethod,
    type WardRelay,
    type WardRelayEndpoint,
    stripAbsent,
} from '@trezor/ward';

import * as settingsStore from '../../data/settingsStore';
import type { DeviceCommands } from '../../device/DeviceCommands';

type Cmd = ReturnType<typeof DeviceCommands>;

// The sync round every conversation opens with. WARDServiceSync takes the place of the WM steps
// when the device is bound to a WARD service.
const SYNC_ROUND = [
    'WARDSync',
    'WARDServiceSync',
    'WARDIngestAttestation',
    'WARDVerifyChain',
    'WARDReconcile',
] as const;
// Publishing a queued intent: the device's candidate, then the WM's confirmation.
const PUBLISH_ROUND = ['WARDPerformBatch', 'WARDConfirmBatchByWM'] as const;

/**
 * What each wardd conversation Connect starts may put on the device. wardd (or whatever answers on
 * its port) is untrusted, so anything else -- GetPublicKey, a silent GetAddress, a WARD write during
 * a lookup -- is answered as a `Failure` without reaching the device. Connect never asks `sync` for
 * a recovery, so the revert messages stay refused.
 */
const RELAY_ALLOWLIST = {
    sync: [...SYNC_ROUND, 'WARDListPendingEdits', ...PUBLISH_ROUND, 'WARDValidateCache'],
    lookup: [...SYNC_ROUND, 'WARDLookup'],
    update: [...SYNC_ROUND, 'WARDLookup', 'WARDQueueUpdate', ...PUBLISH_ROUND],
    cacheEntry: [...SYNC_ROUND, 'WARDCacheEntry'],
} as const satisfies Partial<Record<RelayMethod, readonly MessagesSchema.MessageKey[]>>;

export type WardConversation = keyof typeof RELAY_ALLOWLIST;

/** Run one wardd conversation on this device session. */
export type WardCall = (
    conversation: WardConversation,
    params: Record<string, unknown>,
) => Promise<Record<string, unknown>>;

const requireWardd = (method: string): WardRelay => {
    const wardd = settingsStore.get('wardd');
    if (!wardd) {
        throw ERRORS.TypedError(
            'Runtime',
            `${method} requires wardd to be set via TrezorConnect.init()`,
        );
    }

    return wardd;
};

/** wardd's refusals surface as Connect errors, naming the relay's code. */
const asConnectError = (error: unknown) =>
    error instanceof RelayFailure
        ? ERRORS.TypedError('Runtime', `wardd ${error.code}: ${error.message}`)
        : error;

const refuse = (message: string): RelayMessage => ({
    name: 'Failure',
    message: { code: 'Failure_UnexpectedMessage', message },
});

/**
 * One conversation's relay: only its own flow's messages reach the device. A device Failure is
 * wardd's to see -- it ends the conversation -- so it goes back as a `Failure` message rather than
 * ending the call here.
 */
const createRelay = (cmd: Cmd, conversation: WardConversation): RelayDevice => {
    const allowed: readonly string[] = RELAY_ALLOWLIST[conversation];

    return async ({ name, message }) => {
        if (!allowed.includes(name)) {
            return refuse(`wardd may not send ${name} during ${conversation}`);
        }
        try {
            const res = await cmd.relayCall(name, stripAbsent(message));

            return { name: res.type, message: stripAbsent(res.message) };
        } catch (error) {
            if (error instanceof ERRORS.TrezorError) {
                return { name: 'Failure', message: { code: error.code, message: error.message } };
            }
            throw error;
        }
    };
};

/**
 * Answer the device's pulls from `endpoint` until `releasePulls`.
 * ACCEPTED: any wardd failure to serve a proof is answered `unavailable`; the device may then show
 * a STICKY cached label, possibly stale, marked as cached.
 */
const answerPulls = (cmd: Cmd, endpoint: WardRelayEndpoint) => {
    cmd.setWardProofCallback(async request => {
        try {
            return stripAbsent(
                await endpoint.call('answerProofRequest', { request: stripAbsent(request) }),
            );
        } catch {
            return { unavailable: true };
        }
    });
    cmd.setWardNodeCallback(async request =>
        stripAbsent(await endpoint.call('answerNodeRequest', { request: stripAbsent(request) })),
    );
};

const closeQuietly = async (endpoint: WardRelayEndpoint) => {
    try {
        await endpoint.close();
    } catch {
        // The call's own result stands: a failed close must not lose it.
    }
};

const releasePulls = (cmd: Cmd, endpoint: WardRelayEndpoint) => {
    cmd.setWardProofCallback(undefined);
    cmd.setWardNodeCallback(undefined);

    return closeQuietly(endpoint);
};

/**
 * Lend this device session to wardd for `fn`: each conversation `fn` starts carries its own flow's
 * messages to the device, and the device's pulls are answered from the same endpoint for as long
 * as `fn` runs.
 */
export const withWard = async <T>(
    cmd: Cmd,
    method: string,
    fn: (call: WardCall) => Promise<T>,
): Promise<T> => {
    const endpoint = await requireWardd(method).connect();
    answerPulls(cmd, endpoint);
    try {
        return await fn((conversation, params) =>
            endpoint.call(conversation, params, createRelay(cmd, conversation)),
        );
    } catch (error) {
        throw asConnectError(error);
    } finally {
        await releasePulls(cmd, endpoint);
    }
};

/** One wardd conversation (`sync`, `lookup`, `update`, `cacheEntry`) on this device session. */
export const callWard = <T>(
    cmd: Cmd,
    method: string,
    conversation: WardConversation,
    params: Record<string, unknown>,
) => withWard(cmd, method, async call => (await call(conversation, params)) as T);
