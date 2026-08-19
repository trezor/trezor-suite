/**
 * How a WARD command actually runs — the counterpart to `wardCommands.ts`, which declares the
 * commands but is deliberately kept free of any device or @trezor/connect dependency.
 *
 * OWNS: mapping `--params` onto the wire message, the rules about what cannot run yet, and the
 * one assertion `--queue` is worth making.
 *
 * WHY `--queue` IS AN ASSERTION AND NOT A MODE. There is no queue flag on the wire. The device
 * queues a write exactly when the session has not completed a sync round, and it reports that
 * back as `queued: true` -- an ack carrying no leaf, no counter and no mac, because none of them
 * can be derived without current state. So `--queue` here means "do not sync first", and the
 * only thing left to check is that the device really did take the offline path. Silently
 * accepting an online ack under `--queue` would leave the caller holding a leaf it was told
 * nothing about and must have stored.
 */

import TrezorConnect, { type Device } from '@trezor/connect';

import { type WardCommandContext, type WardCommandName, wardCommands } from './wardCommands';

/** Protobuf `bytes` cross the connect boundary as hex. */
const toHex = (value: string) => Buffer.from(value, 'utf8').toString('hex');

const DEFAULT_APP_ID = 'connect-cli';

const wardAdd = async (context: WardCommandContext, device: Device) => {
    const { queue, params } = context;

    if (!queue) {
        // Said plainly here rather than letting the stub provider's "serveEntry is not
        // implemented" be what the user sees: an online write needs a host store to pull the
        // current leaf from and prove it against the trusted root, and no provider is wired yet.
        throw new Error(
            'an online WARD write needs a registered wardProvider (host store); not wired yet — pass --queue to place the change in the device queue',
        );
    }

    const result = await TrezorConnect.wardSetEntry({
        device,
        app_id: params.app_id ?? DEFAULT_APP_ID,
        identifier: toHex(params.scope),
        value: toHex(params.value),
    });

    if (!result.success) {
        throw new Error(`${result.error.code}: ${result.error.message}`);
    }

    if (result.payload.queued !== true) {
        throw new Error(
            'device applied the write instead of queueing it (the session was already synced); the leaf in this ack must be stored, which --queue does not do',
        );
    }

    return { entry_key: result.payload.entry_key, queued: true };
};

export const runWardCommand = (
    name: WardCommandName,
    context: WardCommandContext,
    device: Device,
): Promise<unknown> => {
    if (name === 'ward_add') {
        return wardAdd(context, device);
    }

    if (name === 'ward_delete' && context.queue) {
        // The device refuses this outright: EMPTY_PART is plaintext, so any host could construct
        // a delete leaf for any entry_key, and uploading queued deletes would hand a host the
        // power to delete anything. A write can wait in a queue; a delete cannot.
        return Promise.reject(
            new Error('a WARD delete cannot be queued; it requires a synced session'),
        );
    }

    return wardCommands[name].run(context);
};
