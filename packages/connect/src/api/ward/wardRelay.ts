import { type PermissionRequest } from '@trezor/connect-common';
import { ERRORS } from '@trezor/connect-common/src/constants';
import { WardRelay as WardRelaySchema } from '@trezor/connect-common/src/types/api/ward/wardRelay';
import { Assert } from '@trezor/schema-utils';

import type { MethodMessage } from '../../core/AbstractMethod';
import { AbstractMethod } from '../../core/AbstractMethod';
import type { DeviceCommands } from '../../device/DeviceCommands';
import { WarddClient, WarddError, type WarddMessage, stripAbsent } from '../../ward/warddClient';

/**
 * `wardRelay`: lend the device to `wardd` for one WARD conversation (sync, flush), or ask it for its
 * status. See the public declaration for the operations; this is the carrier.
 *
 * NO WARD LOGIC HERE, by design. Which message comes next, what a reply means, what to store and
 * when to publish are all wardd's -- the same service every other integration (HWI, BHWI, Lark)
 * talks to. This method's job is the one thing only Connect can do: put a message on THIS device's
 * session and hand back what the device said. `relayCall` is the session's way of doing that
 * without answering the conversation's pulls itself.
 *
 * ONE SESSION FOR THE WHOLE CONVERSATION. A device's WARD sync state belongs to its session, so a
 * sync in one Connect call and a flush in the next would find the second session offline. That is
 * why `flush` is one operation here rather than a loop the caller drives.
 */
export default class WardRelay extends AbstractMethod<'wardRelay', WardRelaySchema> {
    constructor(message: MethodMessage<'wardRelay'>) {
        const { payload } = message;

        Assert(WardRelaySchema, payload);

        super(message, {
            url: payload.url,
            token: payload.token,
            op: payload.op,
            rejoin: payload.rejoin,
            maxBatch: payload.maxBatch,
            wardId: payload.wardId,
            evoluNode: payload.evoluNode,
            proof_of_delegated_identity: payload.proof_of_delegated_identity,
        });
    }

    // `management`, as the rest of WARD -- a flush applies changes to the tree. Fetching the Evolu
    // node is what `evoluGetNode` asks `read_xpub` for, so it is asked for here too when it happens.
    get requiredPermissions(): PermissionRequest[] {
        return this.params.proof_of_delegated_identity
            ? [{ permission: 'management' }, { permission: 'read_xpub' }]
            : [{ permission: 'management' }];
    }

    get info() {
        return 'Ward relay';
    }

    async run() {
        const cmd = this.getDevice().getCommands();
        const { url, token, op } = this.params;

        // A device reply in the relay's shape. A device `Failure` throws from the session; it is
        // the conversation's to see, so it goes back to wardd as a Failure rather than ending the
        // call here, and wardd reports it as `device_failure`.
        const device = async ({ name, message }: WarddMessage): Promise<WarddMessage> => {
            try {
                const res = await cmd.relayCall(name, stripAbsent(message));

                // the relay's form, not the decoder's: see `stripAbsent`
                return { name: res.type, message: stripAbsent(res.message) };
            } catch (error) {
                if (error instanceof ERRORS.TrezorError) {
                    return {
                        name: 'Failure',
                        message: { code: error.code, message: error.message },
                    };
                }
                throw error;
            }
        };

        let client: WarddClient | undefined;
        try {
            client = await WarddClient.connect({ url, token });
            // every op names its wallet -- `status` included, or wardd has no store to report on
            await this.openStore(client, cmd);
            if (op === 'sync')
                return await client.call('sync', { rejoin: !!this.params.rejoin }, device);
            if (op === 'flush') {
                return await client.call('flush', { maxBatch: this.params.maxBatch }, device);
            }

            return await client.call('status');
        } catch (error) {
            if (error instanceof WarddError)
                throw ERRORS.TypedError('Runtime', `wardd ${error.message}`);
            throw error;
        } finally {
            client?.close();
        }
    }

    /** Select the wallet: by the id given, or the device's own; owned by its Evolu node's child. */
    private async openStore(client: WarddClient, cmd: ReturnType<typeof DeviceCommands>) {
        let { wardId, evoluNode } = this.params;
        if (!wardId) {
            const ack = await cmd.relayCall('WardSync', {});
            wardId = (ack.message as { ward_id?: string }).ward_id;
            if (!wardId) throw ERRORS.TypedError('Runtime', 'the device reported no ward_id');
        }
        if (!evoluNode && this.params.proof_of_delegated_identity) {
            const node = await cmd.typedCall('EvoluGetNode', 'EvoluNode', {
                proof_of_delegated_identity: this.params.proof_of_delegated_identity,
            });
            evoluNode = node.message.data;
        }
        await client.call('openStore', { wardId, ...(evoluNode ? { evoluNode } : {}) });
    }
}
