import * as ByteBuffer from 'bytebuffer';
import { Type, Message, Field } from 'protobufjs/light';
import { isPrimitiveField } from '../../utils/protobuf';

const transform = (field: Field, value: any) => {
    // [compatibility]: optional undefined keys should be null. Example: Features.fw_major.
    if (field.optional && typeof value === 'undefined') {
        return null;
    }

    if (field.type === 'bytes') {
        return ByteBuffer.wrap(value).toString('hex');
        // return value.toString('hex');
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
};

function messageToJSON(Message: Message<Record<string, unknown>>, fields: Type['fields']) {
    // get rid of Message.prototype references
    const { ...message } = Message;
    const res: { [key: string]: any } = {};

    Object.keys(fields).forEach(key => {
        const field = fields[key];
        // @ts-ignore
        const value = message[key];

        /* istanbul ignore else  */
        if (field.repeated) {
            /* istanbul ignore else  */
            if (isPrimitiveField(field.type)) {
                res[key] = value.map((v: any) => transform(field, v));
            }
            // [compatibility]: keep array enums as array of numbers.
            else if ('valuesById' in field.resolvedType!) {
                res[key] = value;
            } else if ('fields' in field.resolvedType!) {
                res[key] = value.map((v: any) =>
                    messageToJSON(v, (field.resolvedType as Type).fields),
                );
            } else {
                throw new Error(`case not handled for repeated key: ${key}`);
            }
        } else if (isPrimitiveField(field.type)) {
            res[key] = transform(field, value);
        }
        // enum type
        else if ('valuesById' in field.resolvedType!) {
            res[key] = field.resolvedType.valuesById[value];
        }
        // message type
        else if (field.resolvedType!.fields) {
            res[key] = messageToJSON(value, field.resolvedType!.fields);
        } else {
            throw new Error(`case not handled: ${key}`);
        }
    });

    return res;
}

export const decode = (Message: Type, data: ByteBuffer) => {
    const buff = data.toBuffer();
    const a = new Uint8Array(buff);
    const decoded = Message.decode(a);

    // [compatibility]: in the end it should be possible to get rid of messageToJSON method and call
    // Message.toObject(decoded) to return result as plain javascript object. This method should be able to do
    // all required conversions (for example bytes to hex) but we can't use it at the moment for compatibility reasons
    // for example difference between enum decoding when [enum] vs enum
    return messageToJSON(decoded, decoded.$type.fields);
};
