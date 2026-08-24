/**
 * How a WARD command actually runs — the counterpart to `wardCommands.ts`, which declares the
 * commands but is deliberately kept free of any device or @trezor/connect dependency.
 *
 * OWNS: mapping the command's inputs onto the wire message, the rules about what cannot run yet,
 * and the backup blob's encoding.
 *
 * `--queue` IS A MODE, AND IT PICKS THE MESSAGE. The queue has its own requests, so `--queue`
 * sends `WardQueueSetEntry` and gets back a path and nothing else, while without it
 * `WardSetEntry` goes out and the device requires a synced session. Neither call can answer the
 * other's shape, so there is nothing to assert after the fact -- which is the point of the wire
 * having two requests rather than one with a hidden mode.
 */

import fs from 'fs';

import TrezorConnect, { type Device } from '@trezor/connect';
import { protobufManager } from '@trezor/protobuf';

import { type WardCommandContext, type WardCommandName, wardCommands } from './wardCommands';

/** Protobuf `bytes` cross the connect boundary as hex. */
const toHex = (value: string) => Buffer.from(value, 'utf8').toString('hex');
const fromHex = (value: string) => Buffer.from(value, 'hex').toString('utf8');

const DEFAULT_APP_ID = 'connect-cli';

/**
 * The backup blob: `0x` + the protobuf-encoded `WardQueueGetAck`.
 *
 * NOT A FORMAT OF OUR OWN. The ack IS the backup, protobuf already frames it, and the same encoder
 * the transport uses converts its `bytes` fields to and from hex. A hand-rolled concatenation would
 * be a second framing to keep in step with a message that has already changed twice.
 *
 * The blob is opaque on purpose: a user copies it between two commands and never reads it, so
 * nothing here needs to be legible -- and nothing outside the device can make one, since it carries
 * a MAC only the wallet's own key produces.
 */
const encodeBackup = (ack: Record<string, unknown>) => {
    // Drop absent fields: `decode` reports them as `null`, and `encode` passes null straight into
    // fromJson, which rejects it for a scalar. This is the whole reason the helper exists rather
    // than a one-line call at each site.
    const present = Object.fromEntries(
        Object.entries(ack).filter(([, value]) => value !== null && value !== undefined),
    );

    return `0x${protobufManager.encode('WardQueueGetAck', present).message.toString('hex')}`;
};

const decodeBackup = (blob: string) => {
    const hex = blob.startsWith('0x') || blob.startsWith('0X') ? blob.slice(2) : blob;
    if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) {
        throw new Error('--entry must be hex, as printed by ward_backup');
    }

    try {
        return protobufManager.decode('WardQueueGetAck', Buffer.from(hex, 'hex')).message as Record<
            string,
            any
        >;
    } catch {
        // The decoder's own complaint is about protobuf framing ("premature EOF"), which tells a
        // user nothing about what they typed. What they need to know is that this is not a blob
        // ward_backup produced.
        throw new Error('--entry is not a ward_backup blob: it does not decode');
    }
};

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
        app_id: params.appid ?? DEFAULT_APP_ID,
        identifier: toHex(params.ident),
        value: toHex(params.value),
        compact: params.compact ? true : undefined,
    });

    if (!result.success) {
        throw new Error(`${result.error.code}: ${result.error.message}`);
    }

    // The ack type already means "held, not applied", so there is nothing to check and nothing to
    // report from it: WardQueueSetAck is empty, because a queued change has no path worth naming
    // until it reaches the tree.
    return { queued: true };
};

/**
 * `--target=VAR` prints `VAR=0x…` on STDOUT, so a caller can capture the blob and hand it straight to
 * ward_restore:
 *
 *   eval "$(… ward_backup --target=BLOB | grep -E '^BLOB=0x')"
 *   … ward_restore --entry="$BLOB"
 *
 * An assignment rather than the bare blob because a child process cannot set its parent's variable.
 * The grep is not optional: this CLI logs its progress to stdout as well, so eval'ing everything it
 * printed would fail on the first log line -- see `e2e/ward-queue.sh`.
 */
const captureTarget = (target: string, blob: string) => {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(target)) {
        throw new Error(`--target must be a shell variable name, got "${target}"`);
    }

    // fs.writeSync, not console.log: stdout is a PIPE when a caller captures it, and writes to a
    // pipe are asynchronous -- the `process.exit` that ends every CLI run discards whatever is still
    // buffered, so the assignment silently never arrives. Found by the e2e script, which captured an
    // empty variable.
    fs.writeSync(1, `${target}=${blob}\n`);
};

const wardBackup = async (context: WardCommandContext, device: Device) => {
    const { queue, params } = context;

    if (!queue) {
        throw new Error(
            "ward_backup reads the device's own queue; pass --queue (there is no online export)",
        );
    }

    const result = await TrezorConnect.wardQueueGetEntry({
        device,
        app_id: params.appid,
        identifier: toHex(params.ident),
    });

    if (!result.success) {
        throw new Error(`${result.error.code}: ${result.error.message}`);
    }

    const ack = result.payload as Record<string, any>;

    if (ack.missing) {
        return { missing: true, note: 'nothing queued or kept on the device for this key' };
    }

    if (!ack.mac) {
        // A pinned copy: WARD already holds that value, so there is no intent to re-queue and the
        // device issues no MAC. Printing a blob anyway would hand back something ward_restore is
        // guaranteed to be refused for, which is worse than saying so here.
        return {
            restorable: false,
            note: 'an offline copy, not a queued change -- there is nothing to restore',
            value: ack.value ? fromHex(ack.value) : undefined,
        };
    }

    const entry = encodeBackup(ack);

    if (params.target !== undefined) {
        captureTarget(params.target, entry);

        return { captured: params.target };
    }

    return { entry };
};

/**
 * `ward_display`: show the user what the DEVICE holds for (app_id, identifier).
 *
 * OFFLINE ONLY TODAY, and the flag says so rather than the mode being inferred. `WardGetEntry` --
 * the online read -- pulls the entry from the host and refuses without a synced session, and this
 * CLI has neither a host store to serve it from nor the sync round that would make the session
 * count as synced. So the offline read is asked for by name, exactly as the device asks for it:
 * `WardQueueGetEntry`, which reads the device's own store and emits no pull at all.
 *
 * THE SAME REQUEST AS ward_backup, A DIFFERENT ANSWER. Both read the device's store, because there
 * is one message for that; what separates them is what they hand back. A backup returns the opaque
 * blob and never the value; a display returns the VALUE and never the MAC. Printing the MAC here
 * would turn every look at an entry into an export of a restorable intent, which is a different act
 * and one the screen the device shows does not describe.
 *
 * WHAT THE SCREEN SAYS IS THE POINT. The device distinguishes a change the user queued that no host
 * has taken yet from a copy it merely keeps, and warns that neither has been checked against a
 * host. That distinction is reported here as `pending`, so a caller never has to guess which of the
 * two it just showed the user.
 */
const wardDisplay = async (context: WardCommandContext, device: Device) => {
    const { queue, params } = context;

    if (!queue) {
        // THE ONE BUILD WHERE AN ONLINE READ NEEDS NOTHING FROM US. A firmware that serves WARD
        // over its own interface asks its daemon, not its wallet host, so there is no leaf for
        // this CLI to hold and no pull for it to answer -- the call is simply forwarded and the
        // device does the rest. `--service` is how the caller says that is the build in front of
        // it, because the device does not report it: which transport WARD is served over is a
        // build option, and a host that could be TOLD could be lied to about it.
        if (!params.service) {
            throw new Error(
                'an online WARD read pulls the entry from the host and needs a registered wardProvider and a synced session; not wired yet — pass --queue to show what the DEVICE holds, or --service if this device serves WARD over its own channel',
            );
        }

        const online = await TrezorConnect.wardGetEntry({
            device,
            app_id: params.appid,
            identifier: toHex(params.ident),
        });

        if (!online.success) {
            throw new Error(`${online.error.code}: ${online.error.message}`);
        }

        // `Success` and nothing else, by design: the device SHOWED the entry and kept the value.
        // What is worth reporting is that the read completed -- which on this build means the
        // device synced with its daemon, pulled the leaf and verified it against the root it
        // trusts, all of it out of this host's sight.
        return { displayed: true, onDevice: true, note: online.payload.message };
    }

    const result = await TrezorConnect.wardQueueGetEntry({
        device,
        app_id: params.appid,
        identifier: toHex(params.ident),
    });

    if (!result.success) {
        throw new Error(`${result.error.code}: ${result.error.message}`);
    }

    const ack = result.payload as Record<string, any>;

    if (ack.missing) {
        return { missing: true, note: 'nothing queued or kept on the device for this key' };
    }

    // `pending` is reported rather than folded into a single "found": a queued change is what THIS
    // device believes and no host has taken, while a pinned copy is a value WARD already holds. The
    // device shows those as two different screens, and a caller that collapsed them would describe
    // the user's own unpublished change as an established fact.
    return {
        displayed: true,
        pending: !!ack.pending,
        value: ack.value !== undefined && ack.value !== null ? fromHex(ack.value) : undefined,
    };
};

const wardDelete = async (context: WardCommandContext, device: Device) => {
    const { queue, params } = context;

    if (!queue) {
        // The tree delete needs a synced session and a provider to prove the entry's current value
        // with; neither is wired. Discarding a QUEUED change needs neither, which is why only that
        // half runs today.
        throw new Error(
            'a WARD delete against the tree needs a registered wardProvider and a synced session; not wired yet — pass --queue to discard a QUEUED change instead',
        );
    }

    const result = await TrezorConnect.wardQueueDeleteEntry({
        device,
        app_id: params.appid ?? DEFAULT_APP_ID,
        identifier: toHex(params.ident),
    });

    if (!result.success) {
        throw new Error(`${result.error.code}: ${result.error.message}`);
    }

    // `missing` is reported, not thrown: asking about a change that has already been published is an
    // ordinary thing for a caller reconciling its own view of the queue to do.
    if (result.payload.missing) {
        return { missing: true, note: 'nothing was queued for this key' };
    }

    return { discarded: true };
};

const wardRestore = async (context: WardCommandContext, device: Device) => {
    const { queue, params } = context;

    if (!queue) {
        throw new Error("ward_restore puts a change back into the device's queue; pass --queue");
    }

    const backup = decodeBackup(params.entry);
    if (!backup.mac) {
        throw new Error(
            'this backup carries no MAC, so it is not a queued change; only ward_backup output with an `entry` can be restored',
        );
    }

    // Exactly the four fields the restore takes. The device derives the path and the key space
    // itself and MACs what it derived, so there is nothing else to send and nothing to get wrong.
    const result = await TrezorConnect.wardQueueSetEntry({
        device,
        app_id: backup.app_id,
        identifier: backup.identifier,
        value: backup.value,
        mac: backup.mac,
        compact: params.compact ? true : undefined,
    });

    if (!result.success) {
        throw new Error(`${result.error.code}: ${result.error.message}`);
    }

    return { queued: true, restored: true };
};

export const runWardCommand = (
    name: WardCommandName,
    context: WardCommandContext,
    device: Device,
): Promise<unknown> => {
    if (name === 'ward_add') {
        return wardAdd(context, device);
    }

    if (name === 'ward_backup') {
        return wardBackup(context, device);
    }

    if (name === 'ward_restore') {
        return wardRestore(context, device);
    }

    if (name === 'ward_display') {
        return wardDisplay(context, device);
    }

    if (name === 'ward_delete') {
        // `--queue` discards a QUEUED CHANGE rather than deleting a WARD entry -- there is no such
        // thing as a queued deletion, because EMPTY_PART is plaintext and a host able to hand over
        // delete leaves could delete anything.
        return wardDelete(context, device);
    }

    return wardCommands[name].run(context);
};
