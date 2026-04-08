/* eslint-disable no-console */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { buildDefinitions } from './protobuf-definitions';
import { DISCLAIMER } from './protobuf-patches';

const DIST = path.join(__dirname, '../../protocol/src/protocol-thp/messages');

const buildThpDefinitions = (root: ReturnType<typeof buildDefinitions>) => {
    const lines: string[] = [];
    lines.push(DISCLAIMER, '');

    const defs = JSON.stringify(root.nested);
    lines.push(`export const getProtobufDefinitions = () => (`, defs, `);`, '');

    fs.writeFileSync(`${DIST}/protobufDefinitions.ts`, lines.join('\n'));
};

// merge ThpMessageType into MessageType
// ThpMessageType is defined in thp.proto file
// MessageType is defined in common messages.proto file
const modifyMessageType = (proto: ReturnType<typeof buildDefinitions>) => {
    const messageTypeEnum = proto.nested?.['MessageType'];
    const messageTypeDuplicates = ['ButtonRequest', 'Cancel', 'ButtonAck']; // exclude defined in both messages.proto and thp.proto
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

    const filePath = `${DIST}/protobuf*`;
    const cmd = `yarn workspace @trezor/protocol`;

    console.log('Build successful. patching...');
    let out = execSync(`${cmd} g:prettier --write ${filePath}`);
    console.log('prettier result: ', out.toString('utf-8'));
    out = execSync(`${cmd} g:eslint --fix ${filePath}`);
    console.log('eslint result: ', out.toString('utf-8'));
};

run();
