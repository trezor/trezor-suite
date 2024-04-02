import fs from 'fs';
import path from 'path';

import json from '../messages.json';
import {
    DISCLAIMER,
    RULE_PATCH,
    TYPE_PATCH,
    DEFINITION_PATCH,
    SKIP,
    UINT_TYPE,
    SINT_TYPE,
    FIELD_TYPES,
    ENUM_KEYS,
    ORDER,
    readPatch,
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
    type?: string;
    nested?: Record<string, Definition>;
    fields?: Record<string, Definition>;
    values?: Record<string, unknown>;
};

type ParseMessageOptions = {
    defaultRule?: 'required' | 'optional';
    fixOrder?: boolean;
};

const parseEnum = (itemName: string, item: Definition): TypeItem => {
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

    return {
        type: 'enum',
        name: itemName,
        value: value.join('\n'),
    };
};

const parseMessage = (
    messageName: string,
    message: Definition,
    options?: ParseMessageOptions,
): TypeItem | TypeItem[] => {
    const lines: string[] = [];
    // parse nested values
    const { nested, fields } = message;
    let nestedTypes;
    if (nested) {
        nestedTypes = Object.keys(nested).flatMap(item =>
            parseMessage(item, nested[item], options),
        );
    }

    // parse enum
    if (message.values) {
        return parseEnum(messageName, message);
    }

    if (DEFINITION_PATCH[messageName]) {
        // replace whole declaration with patch
        lines.push(DEFINITION_PATCH[messageName]());
    } else if (!fields || !Object.keys(fields).length) {
        // few types are just empty objects, make it one line
        lines.push(`export type ${messageName} = {};`, '');
    } else {
        // declare type
        lines.push(`export type ${messageName} = {`);
        Object.keys(fields).forEach(fieldName => {
            const field = fields[fieldName];
            const fieldKey = `${messageName}.${fieldName}`;
            // find patch for "rule"
            const fieldRule = RULE_PATCH[fieldKey] || field.rule || options?.defaultRule;
            const rule = fieldRule === 'required' || fieldRule === 'repeated' ? ': ' : '?: ';
            // find patch for "type"
            let type = TYPE_PATCH[fieldKey] || FIELD_TYPES[field.type || ''] || field.type;
            // automatically convert all amount and fee fields to UINT_TYPE
            if (['amount', 'fee'].includes(fieldName)) {
                type = UINT_TYPE;
            }
            // array
            if (field.rule === 'repeated') {
                type = type.split('|').length > 1 ? `Array<${type}>` : `${type}[]`;
            }
            lines.push(`    ${fieldName}${rule}${type};`);
        });
        // close type declaration
        lines.push('};', '');
    }

    return [
        ...(nestedTypes || []),
        {
            type: 'message',
            name: messageName,
            value: lines.join('\n'),
        },
    ];
};

const fixOrder = (types: TypeItem[]) => {
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
};

// skip not needed types
const skipTypes = (types: TypeItem[]) => {
    SKIP.forEach(key => {
        const index = types.findIndex(t => t && t.name === key);
        delete types[index];
    });
};

export const createTypes = (
    def: Definition | Record<string, Definition>,
    options?: ParseMessageOptions,
) => {
    const root = def.nested ? def.nested : def;
    const types = Object.keys(root).flatMap(key => {
        return parseMessage(key, root[key], options);
    });
    skipTypes(types);
    if (options?.fixOrder) {
        fixOrder(types);
    }

    return types;
};

const createCustomTypes = () => {
    const lines: string[] = [];
    lines.push(DISCLAIMER, '');
    lines.push('// custom type uint32/64 may be represented as string');
    lines.push(`export type ${UINT_TYPE} = string | number;`, '');
    lines.push('// custom type sint32/64');
    lines.push(`export type ${SINT_TYPE} = string | number;`, '');
    lines.push(readPatch('customTypes.ts'), '');

    return lines;
};

const createMessageType = (types: TypeItem[]) => {
    const lines: string[] = [];
    lines.push('// custom connect definitions');
    lines.push('export type MessageType = {');
    types
        .flatMap(t => (t && t.type === 'message' ? t : []))
        .forEach(t => {
            lines.push(`    ${t.name}: ${t.name};`);
        });
    lines.push('};');

    lines.push(readPatch('MessageType.ts'));

    return lines;
};

if (require.main === module) {
    // called directly, otherwise required as a module

    const types = createTypes(json, { fixOrder: true });
    const lines = createCustomTypes();
    // create content from types
    const content = types.flatMap(t => (t ? t.value : [])).join('\n');
    lines.push(content);
    // create custom MessageType definition
    lines.push(...createMessageType(types));

    // save to file
    const filePath = path.join(__dirname, '../src/messages.ts');
    fs.writeFile(filePath, lines.join('\n'), err => {
        if (err) return logError(err.message);
    });
}
