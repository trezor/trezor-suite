const fs = require('fs');
const path = require('path');

const json = require('../messages.json');
const {
    RULE_PATCH,
    TYPE_PATCH,
    DEFINITION_PATCH,
    SKIP,
    UINT_TYPE,
    SINT_TYPE,
} = require('./protobuf-patches');

const INDENT = ' '.repeat(4);

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
    'HomescreenFormat',
];

const parseEnum = (itemName, item) => {
    const IS_KEY = ENUM_KEYS.includes(itemName);

    // declare enum
    const enumName = IS_KEY ? `Enum_${itemName}` : itemName;
    const value = [`export enum ${enumName} {`];

    // declare fields
    value.push(...Object.entries(item.values).map(([name, id]) => `${INDENT}${name} = ${id},`));

    // close enum declaration
    value.push('}', '');

    if (IS_KEY) {
        value.push(`export type ${itemName} = keyof typeof ${enumName};`, '');
    }

    types.push({
        type: 'enum',
        name: itemName,
        value: value.join('\n'),
    });
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
            value.push(definition);
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

lines.push('// This file is auto generated from data/messages/message.json', '');
lines.push('// custom type uint32/64 may be represented as string');
lines.push(`export type ${UINT_TYPE} = string | number;`, '');
lines.push('// custom type sint32/64');
lines.push(`export type ${SINT_TYPE} = string | number;`, '');
lines.push(
    `export enum DeviceModelInternal {
    T1B1 = 'T1B1',
    T2T1 = 'T2T1',
    T2B1 = 'T2B1',
}`,
    '',
);
lines.push(content);

// create custom definition

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

// save to file
const filePath = path.join(__dirname, '../src/messages.ts');

fs.writeFile(filePath, lines.join('\n'), err => {
    if (err) return console.log(err);
});
