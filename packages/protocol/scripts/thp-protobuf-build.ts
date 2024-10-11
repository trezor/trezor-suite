import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const DIST = path.join(__dirname, '../src/protocol-thp/messages');

const asyncExec = (cmd: string) =>
    new Promise<string>((resolve, reject) => {
        exec(cmd, (err, out) => {
            if (err) {
                return reject(err);
            }
            resolve(out);
        });
    });

const SKIP = ['ThpCredentialMetadata', 'ThpPairingCredential', 'ThpAuthenticatedCredentialData'];

// Step 1.
// Create json file using protobuf-js/pbjs tool
const readProtobuf = async () => {
    const pbjs = path.join(__dirname, '../../../node_modules/.bin/pbjs');
    const protoFile = path.join(__dirname, 'thp.proto');
    const messages = await asyncExec(`node ${pbjs} -t json --keep-case ${protoFile}`);
    const root = JSON.parse(messages);

    // unwrap nested fields
    const json = root.nested.hw.nested.trezor.nested.messages.nested.thp.nested;
    // const json = unwrapNested(root).hw.trezor.messages.thp;
    // skip types
    SKIP.forEach(key => {
        delete json[key];
    });

    return json;
};

// Step 2.
// Build definitions
const buildDefinitions = async () => {
    const root = await readProtobuf();

    // TODO: read it from fw repo?
    root.MessageType = {
        values: {
            MessageType_ThpCreateNewSession: 1000,
            MessageType_ThpNewSession: 1001,
            MessageType_ThpStartPairingRequest: 1008,
            MessageType_ThpPairingPreparationsFinished: 1009,
            MessageType_ThpCredentialRequest: 1010,
            MessageType_ThpCredentialResponse: 1011,
            MessageType_ThpEndRequest: 1012,
            MessageType_ThpEndResponse: 1013,
            MessageType_ThpCodeEntryCommitment: 1016,
            MessageType_ThpCodeEntryChallenge: 1017,
            MessageType_ThpCodeEntryCpaceHost: 1018,
            MessageType_ThpCodeEntryCpaceTrezor: 1019,
            MessageType_ThpCodeEntryTag: 1020,
            MessageType_ThpCodeEntrySecret: 1021,
            MessageType_ThpQrCodeTag: 1024,
            MessageType_ThpQrCodeSecret: 1025,
            MessageType_ThpNfcUnidirectionalTag: 1032,
            MessageType_ThpNfcUnidirectionalSecret: 1033,
        },
    };

    const lines = [];
    lines.push('// This file is auto generated from ./thp.proto');
    lines.push('');

    lines.push(`export const getThpProtobufMessages = () => { return ${JSON.stringify(root)}; };`);
    lines.push('');

    fs.writeFile(`${DIST}/protobufDefinitions.ts`, lines.join('\n'), err => {
        if (err) return console.error(err);
    });

    return root;
};

const ENUM_KEYS: string[] = [];
const RULE_PATCH: Record<string, string> = {
    'ThpHandshakeCompletionReqNoisePayload.host_pairing_credential': 'optional',
    'ThpCreateNewSession.passphrase': 'optional',
    'ThpCreateNewSession.on_device': 'optional',
    'ThpCreateNewSession.derive_cardano': 'optional',
};
const TYPE_PATCH: Record<string, string> = {};
const INDENT = ' '.repeat(4);
const FIELD_TYPES: Record<string, string> = {
    uint32: 'number',
    uint64: 'number',
    sint32: 'number',
    sint64: 'number',
    bool: 'boolean',
    bytes: 'string',
};

const buildTypes = (root: Record<string, unknown>) => {
    const lines = [];
    const types: string[] = [];
    const messageTypes: string[] = [];

    const parseEnum = (itemName: string, item: any) => {
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

        types.push(value.join('\n'));
    };

    const parseMessage = (messageName: string, message: any) => {
        const value = [];

        if (message.values) {
            return parseEnum(messageName, message);
        } else if (!message.fields || !Object.keys(message.fields).length) {
            // few types are just empty objects, make it one line
            value.push(`export type ${messageName} = Record<string, never>;`);
            value.push('');
        } else {
            // declare type
            value.push(`export type ${messageName} = {`);
            Object.keys(message.fields).forEach(fieldName => {
                const field = message.fields[fieldName];
                const fieldKey = `${messageName}.${fieldName}`;
                // find patch for "rule"
                // NOTE: most of the fields are marked "optional" but in fact they are required
                const fieldRule = RULE_PATCH[fieldKey] || field.rule || 'required';
                const rule = fieldRule === 'required' || fieldRule === 'repeated' ? ': ' : '?: ';
                // find patch for "type"
                let type = TYPE_PATCH[fieldKey] || FIELD_TYPES[field.type] || field.type;
                // array
                if (field.rule === 'repeated') {
                    type = type.split('|').length > 1 ? `Array<${type}>` : `${type}[]`;
                }
                value.push(`${INDENT}${fieldName}${rule}${type};`);
            });
            // close type declaration
            value.push('};');
            // empty line
            value.push('');
        }

        messageTypes.push(messageName);
        types.push(value.join('\n'));
    };

    Object.keys(root).map(e => parseMessage(e, root[e]));

    lines.push('// This file is auto generated from ./protobufDefinitions.ts', '');
    lines.push('');

    lines.push(...types);

    lines.push('export type ThpProtobufMessageType = {');
    messageTypes.forEach(t => {
        lines.push(`    ${t}: ${t};`);
    });
    lines.push('};');
    lines.push('');

    const filePath = `${DIST}/protobufTypes.ts`;
    fs.writeFile(filePath, lines.join('\n'), err => {
        if (err) return console.error(err);
    });
};

buildDefinitions()
    .then(buildTypes)
    .then(() => {
        const filePath = `${DIST}/protobuf*`;
        const cmd = `yarn workspace @trezor/protocol`;

        return asyncExec(`${cmd} g:prettier --write ${filePath}`).then(() =>
            asyncExec(`${cmd} g:eslint --fix ${filePath}`),
        );
    });
