import { ERRORS } from '@trezor/connect-common/src/constants';
import { type MessagesSchema as PROTO, protobufManager } from '@trezor/protobuf';
import { typedObjectEntries } from '@trezor/utils';

import type { TypedCall } from '../DeviceCommands';
import type { ModularAppDefinition } from './types';

// Wraps a raw device `typedCall` so a loaded modular app can be addressed with the same signature the
// native methods use. Each call encodes the app message, sends it inside ExtAppMessage, then decodes
// the app-local response id carried by ExtAppResponse back into a wire message name.
export const getModularAppTypedCall = (
    typedCall: TypedCall,
    appDef: ModularAppDefinition,
    instanceId: number,
): TypedCall => {
    const idToName = new Map<number, PROTO.MessageKey>();
    typedObjectEntries(appDef.messageIds).forEach(([name, id]) => {
        if (id !== undefined) idToName.set(id, name);
    });

    const wrapped = async (
        type: PROTO.MessageKey,
        expectedType: PROTO.MessageKey | PROTO.MessageKey[],
        message: Record<string, unknown> = {},
    ) => {
        const messageId = appDef.messageIds[type];
        if (messageId === undefined) {
            throw ERRORS.TypedError('Runtime', `modularApp: no message id mapped for ${type}`);
        }

        const { message: encoded } = protobufManager.encode(type, message);

        const response = await typedCall('ExtAppMessage', 'ExtAppResponse', {
            instance_id: instanceId,
            message_id: messageId,
            data: encoded.toString('hex'),
        });

        const responseName = idToName.get(response.message.message_id);
        if (!responseName) {
            throw ERRORS.TypedError(
                'Runtime',
                `modularApp: unknown response message id ${response.message.message_id}`,
            );
        }

        const expected = Array.isArray(expectedType) ? expectedType : [expectedType];
        if (!expected.includes(responseName)) {
            throw ERRORS.TypedError(
                'Runtime',
                `modularApp: unexpected response ${responseName}, expected ${expected.join(', ')}`,
            );
        }

        const { message: decoded } = protobufManager.decode(
            responseName,
            Buffer.from(response.message.data, 'hex'),
        );

        return { type: responseName, message: decoded };
    };

    return wrapped;
};
