import fs from 'fs';
import path from 'path';

import json from '../messages.json';
import {
    RULE_PATCH,
    TYPE_PATCH,
    DEFINITION_PATCH,
    SKIP,
    UINT_TYPE,
    SINT_TYPE,
    FIELD_TYPES,
    ENUM_KEYS,
    ORDER,
} from './protobuf-patches';

const CONSOLE_RED = '\x1b[31m';
const CONSOLE_RESET = '\x1b[0m';

const logError = (text: string) => {
    console.error(`Error: ${CONSOLE_RED}${text}${CONSOLE_RESET}`);
};

const INDENT = ' '.repeat(4);

type TypeItem = {
    type: 'enum' | 'message';
    name: string;
    value: string;
};

type Definition = {
    options?: Record<string, unknown>;
    rule?: string;
    type: string;
    nested?: Record<string, Definition>;
    fields?: Record<string, Definition>;
    values?: Record<string, unknown>;
};

const types: TypeItem[] = [];

const parseEnum = (itemName: string, item: Definition) => {
    const IS_KEY = ENUM_KEYS.includes(itemName);

    // declare enum
    const enumName = IS_KEY ? `Enum_${itemName}` : itemName;
    const value = [`export enum ${enumName} {`];

    // declare fields
    value.push(
        ...Object.entries(item.values || {}).map(([name, id]) => `${INDENT}${name} = ${id},`),
    );

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

const parseMessage = (messageName: string, message: Definition, depth = 0) => {
    const value: string[] = [];
    // add comment line
    if (!depth) value.push(`// ${messageName}`);
    // declare nested enums

    // declare nested values
    const { nested, fields } = message;
    if (nested) {
        Object.keys(nested).map(item => parseMessage(item, nested[item], depth + 1));
    }

    if (message.values) {
        return parseEnum(messageName, message);
    }
    if (!fields || !Object.keys(fields).length) {
        // few types are just empty objects, make it one line
        value.push(`export type ${messageName} = {};`);
        value.push('');
    } else {
        // find patch
        const definition = DEFINITION_PATCH[messageName];
        if (definition) {
            // replace whole declaration
            value.push(definition());
        } else {
            // declare type
            value.push(`export type ${messageName} = {`);
            Object.keys(fields).forEach(fieldName => {
                const field = fields[fieldName];
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
    types.push({
        type: 'message',
        name: messageName,
        value: value.join('\n'),
    });
};

// top level messages and nested messages
Object.keys(json.nested).map(e => parseMessage(e, json.nested[e]));

Object.keys(ORDER).forEach(key => {
    if (key === ORDER[key]) {
        logError(`ORDER map cannot have key=value`);
    }

    // find indexes
    const indexOfDependency = types.findIndex(t => t && t.name === key);
    if (indexOfDependency === -1) {
        logError(`Type from key: '${key}' not found in the 'types' variable!`);
    }

    const indexOfDependant = types.findIndex(t => t && t.name === ORDER[key]);
    if (indexOfDependant === -1) {
        logError(`Type from value: '${ORDER[key]}' not found in the 'types' variable!`);
    }

    const dependency = types[indexOfDependency];
    // replace values
    delete types[indexOfDependency];
    types.splice(indexOfDependant, 0, dependency);
});

// skip not needed types
SKIP.forEach(key => {
    const index = types.findIndex(t => t && t.name === key);
    delete types[index];
});

// create content from types
const content = types.flatMap(t => (t ? [t.value] : [])).join('\n');

const lines: string[] = [];

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
    T3B1 = 'T3B1',
    T3T1 = 'T3T1',
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
    if (err) return logError(err.message);
});
