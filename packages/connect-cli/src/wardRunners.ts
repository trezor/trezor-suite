/**
 * How a WARD command actually runs — the counterpart to `wardCommands.ts`, which declares the
 * commands but is deliberately kept free of any device or @trezor/connect dependency.
 *
 * OWNS: mapping `--params` onto the wire message, the rules about what cannot run yet, and the
 * one assertion `--queue` is worth making.
 *
 * `--queue` IS A MODE, AND IT PICKS THE MESSAGE. The queue has its own requests, so `--queue`
 * sends `WardQueueSetEntry` and gets back a path and nothing else, while without it
 * `WardSetEntry` goes out and the device requires a synced session. Neither call can answer the
 * other's shape, so there is nothing to assert after the fact -- which is the point of the wire
 * having two requests rather than one with a hidden mode.
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
        // implemented" be what the user sees: an applying write needs a host store to pull the
        // current leaf from and prove it against the trusted root, and no provider is wired yet.
        throw new Error(
            'an applying WARD write needs a registered wardProvider (host store) and a synced session; not wired yet — pass --queue to hold the change on the device',
        );
    }

    const result = await TrezorConnect.wardQueueSetEntry({
        device,
        app_id: params.app_id ?? DEFAULT_APP_ID,
        identifier: toHex(params.scope),
        value: toHex(params.value),
    });

    if (!result.success) {
        throw new Error(`${result.error.code}: ${result.error.message}`);
    }

    // The ack type already means "held, not applied", so there is nothing to check and nothing to
    // report from it: WardQueueSetAck is empty, because a queued change has no path worth naming
    // until it reaches the tree.
    return { queued: true };
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
        // `WardQueueDeleteEntry` discards a QUEUED CHANGE; it does not delete a WARD entry, and
        // there is no such thing as a queued deletion (EMPTY_PART is plaintext, so a host able to
        // hand over delete leaves could delete anything). Wiring the discard is separate work, so
        // this refuses rather than quietly doing the other thing.
        return Promise.reject(
            new Error(
                'a WARD delete cannot be queued; --queue on ward_delete would discard a queued change instead, which is not wired yet',
            ),
        );
    }

    return wardCommands[name].run(context);
};
