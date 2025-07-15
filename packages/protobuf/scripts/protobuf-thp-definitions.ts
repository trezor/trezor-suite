/* eslint-disable no-console */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { buildDefinitions } from './protobuf-definitions';
import { DISCLAIMER } from './protobuf-patches';
import { createTypes } from './protobuf-types';

const DIST = path.join(__dirname, '../../protocol/src/protocol-thp/messages');

const buildThpDefinitions = (root: ReturnType<typeof buildDefinitions>) => {
    const lines: string[] = [];
    lines.push(DISCLAIMER, '');

    const defs = JSON.stringify(root.nested);
    lines.push(`export const getProtobufDefinitions = () => (`, defs, `);`, '');

    fs.writeFileSync(`${DIST}/protobufDefinitions.ts`, lines.join('\n'));
};

const createMessageType = (types: ReturnType<typeof createTypes>) => {
    const lines: string[] = [];
    lines.push('export type ThpProtobufMessageType = {');
    types
        .flatMap(t => (t && t.type === 'message' ? t : []))
        .forEach(t => {
            lines.push(`    ${t.name}: ${t.name};`);
        });
    lines.push('};', '');

    return lines;
};

const buildThpTypes = (json: ReturnType<typeof buildDefinitions>) => {
    const types = createTypes(json, { defaultRule: 'required', fixOrder: false });
    const lines: string[] = [];
    lines.push(DISCLAIMER, '');

    const content = lines
        .concat(
            types.flatMap(t => (t ? t.value : [])),
            createMessageType(types),
        )
        .join('\n');

    fs.writeFileSync(`${DIST}/protobufTypes.ts`, content);
};

// merge ThpMessageType into MessageType
// ThpMessageType is defined in thp.proto file
// MessageType is defined in common messages.proto file
const modifyMessageType = (proto: ReturnType<typeof buildDefinitions>) => {
    const messageTypeEnum = proto.nested?.['MessageType'];
    const messageTypeDuplicates = ['ButtonRequest', 'Cancel']; // exclude defined in both messages.proto and thp.proto
    const thpMessageTypeEnum = proto.nested?.['ThpMessageType'];
    const thpMessageType = thpMessageTypeEnum?.values;
    if (messageTypeEnum && thpMessageType) {
        Object.keys(thpMessageType).forEach(key => {
            // replace key `ThpMessageType_XXX` > `XXX`
            const newKey = key.replace('ThpMessageType_', '');
            const value = thpMessageType[key];
            // add new key to MessageType
            if (!messageTypeDuplicates.includes(newKey)) {
                messageTypeEnum.values![newKey] = value;
            }
        });
    }
    // remove ThpMessageType enum
    delete proto.nested?.['ThpMessageType'];
};

const run = () => {
    const [protoDir] = process.argv.slice(2);
    const defs = buildDefinitions(protoDir, {
        includeImports: true,
        onlyPackages: ['', 'thp'], // empty package == messages.proto file (MessageType definitions), see buildDefinitions function
    });

    modifyMessageType(defs);
    buildThpDefinitions(defs);
    buildThpTypes(defs);

    const filePath = `${DIST}/protobuf*`;
    const cmd = `yarn workspace @trezor/protocol`;

    console.log('Build successful. patching...');
    let out = execSync(`${cmd} g:prettier --write ${filePath}`);
    console.log('prettier result: ', out.toString('utf-8'));
    out = execSync(`${cmd} g:eslint --fix ${filePath}`);
    console.log('eslint result: ', out.toString('utf-8'));
};

run();
