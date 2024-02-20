import { Type, Message, Field } from 'protobufjs/light';

import { isPrimitiveField } from './utils';

const transform = (field: Field, value: any) => {
    if (isPrimitiveField(field.type)) {
        // [compatibility]: optional undefined keys should be null. Example: Features.fw_major.
        if (field.optional && typeof value === 'undefined') {
            return null;
        }

        if (field.type === 'bytes') {
            return Buffer.from(value).toString('hex');
        }

        // [compatibility]
        // it is likely that we can remove this right away because trezor-connect tests don't ever trigger this condition
        // we should probably make sure that trezor-connect treats following protobuf types as strings: int64, uint64, sint64, fixed64, sfixed64
        if (field.long) {
            if (Number.isSafeInteger(value.toNumber())) {
                // old trezor-link behavior https://github.com/trezor/trezor-link/blob/9c200cc5608976cff0542484525e98c753ba1888/src/lowlevel/protobuf/message_decoder.js#L80
                return value.toNumber();
            }

            // otherwise return as string
            return value.toString();
        }

        return value;
    }

    // enum type
    if ('valuesById' in field.resolvedType!) {
        return field.resolvedType.valuesById[value];
    }
    // message type
    if (field.resolvedType!.fields) {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return messageToJSON(value, field.resolvedType!.fields);
    }
    // should not happen
    throw new Error(`transport: decode: case not handled: ${field}`);
};

export function messageToJSON(
    MessageParam: Message<Record<string, unknown>>,
    fields: Type['fields'],
) {
    // get rid of Message.prototype references
    const { ...message } = MessageParam;
    const res: { [key: string]: any } = {};

    Object.keys(fields).forEach(key => {
        const field = fields[key];
        // @ts-expect-error
        const value = message[key];

        if (field.repeated) {
            res[key] = value.map((v: any) => transform(field, v));
        } else {
            res[key] = transform(field, value);
        }
    });

    return res;
}

export const decode = (MessageParam: Type, data: Buffer) => {
    const decoded = MessageParam.decode(new Uint8Array(data));

    // [compatibility]: in the end it should be possible to get rid of messageToJSON method and call
    // Message.toObject(decoded) to return result as plain javascript object. This method should be able to do
    // all required conversions (for example bytes to hex) but we can't use it at the moment for compatibility reasons
    // for example difference between enum decoding when [enum] vs enum
    return messageToJSON(decoded, decoded.$type.fields);
};
