import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { buildDefinitions } from './protobuf-definitions';
import { createTypes } from './protobuf-types';
import { DISCLAIMER } from './protobuf-patches';

const DIST = path.join(__dirname, '../../protocol/src/protocol-thp/messages');

const buildThpDefinitions = (root: ReturnType<typeof buildDefinitions>) => {
    const lines: string[] = [];
    lines.push(DISCLAIMER, '');

    const defs = JSON.stringify(root.nested);
    lines.push(`export const getProtobufDefinitions = () => {`, `return ${defs};`, `};`, '');

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

const run = () => {
    const [protoDir] = process.argv.slice(2);
    // @ts-expect-error: temporary
    const localPath = path.join(process.env.HOME, 'Workspace/trezor-firmware/common/protob');
    const defs = buildDefinitions(protoDir || localPath, {
        includeImports: false,
        onlyPackages: ['thp'],
        messageType: 'ThpMessageType',
    });

    buildThpDefinitions(defs);
    buildThpTypes(defs);

    const filePath = `${DIST}/protobuf*`;
    const cmd = `yarn workspace @trezor/protocol`;

    execSync(`${cmd} g:prettier --write ${filePath}`);
    execSync(`${cmd} g:eslint --fix ${filePath}`);
};

run();
