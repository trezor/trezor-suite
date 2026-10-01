import type { WardProvider } from '@trezor/connect-common';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';

import { WarddClient, type WarddClientOptions, stripAbsent } from './warddClient';

/**
 * A `wardProvider` backed by `wardd`: the device's mid-call pulls are answered from the local WARD
 * service's replica instead of from storage the host application keeps itself.
 *
 * A DROP-IN for the existing `wardProvider` setting -- Connect's device layer is unchanged, and a
 * host that does not register this keeps exactly the behaviour it had.
 *
 * THE STAGED SET IS REBUILT HERE. Connect hands a provider one `WardEntryRequest` at a time, but a
 * batched flush proves each change against the device's RUNNING root, so wardd must be told every
 * change folded so far. The device's framing makes that recoverable: the first pull of a
 * conversation never carries `staged`, and every later pull of a batch carries the change just
 * folded. So a pull without it starts a new set, and a pull with it extends the current one.
 *
 * THE WALLET IS CHOSEN, NOT INFERRED: a pull names an entry, never the wallet it belongs to, so the
 * host calls `openStore` for the wallet it has unlocked before any call that pulls.
 *
 * AFTER A WRITE, `applyResult`: the device hands back the leaf it built (`WardLeafAck`,
 * `WardFlushQueueAck`), and nothing takes effect until a replica stores it and the WM confirms it.
 * The host passes the ack's `message` here; wardd stores it, publishes it, and reports whether the
 * WM took it.
 */
export type WarddProvider = WardProvider & {
    openStore(params: { wardId: string; evoluNode?: string }): Promise<Record<string, unknown>>;
    applyResult(message: Record<string, unknown>): Promise<Record<string, unknown>>;
    status(): Promise<Record<string, unknown>>;
};

export const createWarddProvider = (options: WarddClientOptions): WarddProvider => {
    let client: Promise<WarddClient> | undefined;
    let staged: [string, string][] = [];

    const connected = () => {
        if (!client) {
            client = WarddClient.connect(options);
            // a failed connection is not cached: the next call tries again
            client.catch(() => {
                client = undefined;
            });
        }

        return client;
    };

    return {
        async openStore(params) {
            staged = [];

            return (await connected()).call('openStore', params);
        },

        async serveEntry(request: PROTO.WardEntryRequest) {
            const { entry_key: entryKey, commit } = request.staged ?? {};
            if (entryKey && commit) staged.push([entryKey, commit]);
            else staged = [];
            const ack = await (
                await connected()
            ).call('serveEntry', {
                request: stripAbsent(request),
                staged,
            });

            return stripAbsent(ack) as PROTO.WardEntryAck;
        },

        async applyResult(message) {
            return (await connected()).call('applyResult', stripAbsent(message));
        },

        async status() {
            return (await connected()).call('status');
        },

        async dispose() {
            const open = client;
            client = undefined;
            (await open?.catch(() => undefined))?.close();
        },
    };
};
