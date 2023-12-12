import { Type } from 'protobufjs/light';

import { isPrimitiveField } from './utils';

const transform = (fieldType: string, value: any) => {
    if (fieldType === 'bytes') {
        // special edge case
        // for example MultisigRedeemScriptType might have field signatures ['', '', ''] (check in TrezorConnect signTransactionMultisig test fixtures).
        // trezor needs to receive such field as signatures: [b'', b'', b'']. If we transfer this to empty buffer with protobufjs, this will be decoded by
        // trezor as signatures: [] (empty array)
        if (typeof value === 'string' && !value) return value;

        // normal flow
        return Buffer.from(value, 'hex');
    }
    if (typeof value === 'number' && !Number.isSafeInteger(value)) {
        throw new RangeError('field value is not within safe integer range');
    }
    return value;
};

export function patch(Message: Type, payload: any) {
    const patched: any = {};

    if (!Message.fields) {
        return patched;
    }

    Object.keys(Message.fields).forEach(key => {
        const field = Message.fields[key];
        const value = payload[key];

        // no value for this field
        if (typeof value === 'undefined') {
            return;
        }
        // primitive type
        if (isPrimitiveField(field.type)) {
            if (field.repeated) {
                patched[key] = value.map((v: any) => transform(field.type, v));
            } else {
                patched[key] = transform(field.type, value);
            }
            return;
        }
        // repeated
        if (field.repeated) {
            const RefMessage = Message.lookupTypeOrEnum(field.type);
            patched[key] = value.map((v: any) => patch(RefMessage, v));
        }
        // message type
        else if (typeof value === 'object' && value !== null) {
            const RefMessage = Message.lookupType(field.type);
            patched[key] = patch(RefMessage, value);
        }
        // enum type
        else if (typeof value === 'number') {
            const RefMessage = Message.lookupEnum(field.type);
            patched[key] = RefMessage.values[value];
        } else {
            patched[key] = value;
        }
    });

    return patched;
}

export const encode = (Message: Type, data: Record<string, unknown>) => {
    const payload = patch(Message, data);
    const message = Message.fromObject(payload);
    // Encode a message to an Uint8Array (browser) or Buffer (node)
    const bytes = Message.encode(message).finish();
    return Buffer.from(bytes);
};
