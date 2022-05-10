// flowtype only
// flowtype doesn't have `enum` declarations like typescript

const fs = require('fs');
const path = require('path');

const json = require('../messages.json');
const { RULE_PATCH, TYPE_PATCH, DEFINITION_PATCH, SKIP, UINT_TYPE } = require('./protobuf-patches');

const args = process.argv.slice(2);

const isTypescript = args.includes('typescript');

// proto types to javascript types
const FIELD_TYPES = {
    uint32: 'number',
    uint64: 'number',
    sint32: 'number',
    sint64: 'number',
    bool: 'boolean',
    bytes: 'string',
    // 'bytes': 'Uint8Array | number[] | Buffer | string', // protobuf will handle conversion
};

const types = []; // { type: 'enum | message', name: string, value: string[], exact?: boolean };

// enums used as keys (string), used as values (number) by default
const ENUM_KEYS = [
    'InputScriptType',
    'OutputScriptType',
    'RequestType',
    'BackupType',
    'Capability',
    'SafetyCheckLevel',
    'ButtonRequestType',
    'PinMatrixRequestType',
    'WordRequestType',
];

const parseEnumTypescript = (itemName, item) => {
    const value = [];
    const IS_KEY = ENUM_KEYS.includes(itemName);
    // declare enum
    if (IS_KEY) {
        value.push(`export enum Enum_${itemName} {`);
    } else {
        value.push(`export enum ${itemName} {`);
    }

    // declare fields
    Object.entries(item.values).forEach(([name, id]) => {
        value.push(`    ${name} = ${id},`);
    });
    // close enum declaration
    value.push('}');

    if (IS_KEY) {
        value.push(`export type ${itemName} = keyof typeof Enum_${itemName};`);
    }
    // empty line
    value.push('');

    types.push({
        type: 'enum',
        name: itemName,
        value: value.join('\n'),
    });
};

const parseEnum = (itemName, item) => {
    if (isTypescript) return parseEnumTypescript(itemName, item);
    const value = [];
    // declare enum
    value.push(`export const Enum_${itemName} = Object.freeze({`);
    // declare fields
    Object.entries(item.values).forEach(([name, id]) => {
        value.push(`    ${name}: ${id},`);
    });
    // close enum declaration
    value.push('});');
    // declare enum type using Keys or Values
    const KEY = ENUM_KEYS.includes(itemName) ? 'Keys' : 'Values';
    value.push(`export type ${itemName} = $${KEY}<typeof Enum_${itemName}>;`);
    // empty line
    value.push('');

    types.push({
        type: 'enum',
        name: itemName,
        value: value.join('\n'),
    });
};

const useDefinition = def => {
    // remove flow overhead
    const clean = def
        .replace(/\/\/ @flow/, '')
        .replace(/\/\/ @overhead-start(.*)@overhead-end/s, '');

    if (isTypescript) {
        // use typescript variant
        // replace flowtype $Exact declaration: {| foo: 1 |} => { foo: 1 }
        // replace flowtype spread with typescript union: { ...T, foo: 1 } => T & { foo: 1 }, see TxInputType patch
        return clean
            .replace(/\/\/ @typescript-variant:/, '')
            .replace(/\/\/ @flowtype-variant(.*)/, '')
            .replace(/{\|/gi, '{')
            .replace(/\|}/gi, '}')
            .replace(/\{\n.*.\.{3}(.*?),/g, '$1 & {');
    }
    return clean.replace(/\/\/ @typescript-variant(.*)/, '').replace(/\/\/ @flowtype-variant:/, '');
};

const parseMessage = (messageName, message, depth = 0) => {
    if (messageName === 'google') return;
    const value = [];
    // add comment line
    if (!depth) value.push(`// ${messageName}`);
    // declare nested enums

    // declare nested values
    if (message.nested) {
        Object.keys(message.nested).map(item =>
            parseMessage(item, message.nested[item], depth + 1),
        );
    }

    if (message.values) {
        return parseEnum(messageName, message);
    }
    if (!message.fields || !Object.keys(message.fields).length) {
        // few types are just empty objects, make it one line
        value.push(`export type ${messageName} = {};`);
        value.push('');
    } else {
        // find patch
        const definition = DEFINITION_PATCH[messageName];
        if (definition) {
            // replace whole declaration
            value.push(useDefinition(definition));
        } else {
            // declare type
            value.push(`export type ${messageName} = {`);
            Object.keys(message.fields).forEach(fieldName => {
                const field = message.fields[fieldName];
                const fieldKey = `${messageName}.${fieldName}`;
                // find patch for "rule"
                const fieldRule = RULE_PATCH[fieldKey] || field.rule;
                const rule = fieldRule === 'required' || fieldRule === 'repeated' ? ': ' : '?: ';
                // find patch for "type"
                let type = TYPE_PATCH[fieldKey] || FIELD_TYPES[field.type] || field.type;
                // automatically convert all amount and fee fields to UINT_TYPE
                if (['amount', 'fee'].includes(fieldName)) {
                    type = UINT_TYPE;
                }
                // array
                if (field.rule === 'repeated') {
                    type = type.split('|').length > 1 ? `Array<${type}>` : `${type}[]`;
                }
                value.push(`    ${fieldName}${rule}${type};`);
            });
            // close type declaration
            value.push('};');
            // empty line
            value.push('');
        }
    }
    // type doest have to be e
    const exact = message.fields && Object.values(message.fields).find(f => f.rule === 'required');
    types.push({
        type: 'message',
        name: messageName,
        value: value.join('\n'),
        exact,
    });
};

// top level messages and nested messages
Object.keys(json.nested).map(e => parseMessage(e, json.nested[e]));

// types needs reordering (used before defined)
const ORDER = {
    BinanceCoin: 'BinanceInputOutput',
    HDNodeType: 'HDNodePathType',
    CardanoAssetGroupType: 'CardanoTxOutputType',
    CardanoTokenType: 'CardanoAssetGroupType',
    TxAck: 'TxAckInputWrapper',
    EthereumFieldType: 'EthereumStructMember',
    EthereumDataType: 'EthereumFieldType',
    PaymentRequestMemo: 'TxAckPaymentRequest',
};

Object.keys(ORDER).forEach(key => {
    // find indexes
    const indexA = types.findIndex(t => t && t.name === key);
    const indexB = types.findIndex(t => t && t.name === ORDER[key]);
    const prevA = types[indexA];
    // replace values
    delete types[indexA];
    types.splice(indexB, 0, prevA);
});

// skip not needed types
SKIP.forEach(key => {
    const index = types.findIndex(t => t && t.name === key);
    delete types[index];
});

// create content from types
const content = types.flatMap(t => (t ? [t.value] : [])).join('\n');

const lines = []; // string[]
if (!isTypescript) lines.push('// @flow');
lines.push('// This file is auto generated from data/messages/message.json');
lines.push('');
lines.push('// custom type uint32/64 may be represented as string');
lines.push(`export type ${UINT_TYPE} = string | number;`);
lines.push('');
lines.push(content);

// create custom definition
if (!isTypescript) {
    lines.push('// custom connect definitions');
    lines.push('export type MessageType = {');
    types
        .flatMap(t => (t && t.type === 'message' ? [t] : []))
        .forEach(t => {
            if (t.exact) {
                lines.push(`    ${t.name}: $Exact<${t.name}>;`);
            } else {
                lines.push(`    ${t.name}: ${t.name};`);
            }
            // lines.push('    ' + t.name + ': $Exact<' + t.name + '>;');
        });
    lines.push('};');

    // additional types utilities
    lines.push(`
export type MessageKey = $Keys<MessageType>;

export type MessageResponse<T: MessageKey> = {
    type: T;
    message: $ElementType<MessageType, T>;
};

export type TypedCall = <T: MessageKey, R: MessageKey>(
    type: T,
    resType: R,
    message?: $ElementType<MessageType, T>
) => Promise<MessageResponse<R>>;
`);
} else {
    lines.push('// custom connect definitions');
    lines.push('export type MessageType = {');
    types
        .flatMap(t => (t && t.type === 'message' ? [t] : []))
        .forEach(t => {
            lines.push(`    ${t.name}: ${t.name};`);
        });
    lines.push('};');

    // additional types utilities
    lines.push(`
export type MessageKey = keyof MessageType;

export type MessageResponse<T extends MessageKey> = {
    type: T;
    message: MessageType[T];
};

export type TypedCall = <T extends MessageKey, R extends MessageKey>(
    type: T,
    resType: R,
    message?: MessageType[T],
) => Promise<MessageResponse<R>>;
`);
}

// save to file
const filePath = isTypescript
    ? path.join(__dirname, '../src/types/messages.ts')
    : path.join(__dirname, '../protobuf.js');
fs.writeFile(filePath, lines.join('\n'), err => {
    if (err) return console.log(err);
});
