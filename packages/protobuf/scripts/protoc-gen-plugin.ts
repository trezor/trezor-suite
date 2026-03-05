#!/usr/bin/env tsx

import { Schema, createEcmaScriptPlugin, runNodeJs } from '@bufbuild/protoplugin';

function parseOptions() {
    return {};
}

function generateTs(schema: Schema<{}>) {
    //
}

function generateJs() {
    //
}

function generateDts(schema: Schema<{}>) {
    for (const file of schema.files) {
        const f = schema.generateFile(file.name + '_pb.d.ts');
        f.preamble(file);
        f.print("import type { DescFile } from '@bufbuild/protobuf';");
        f.print();

        f.print(`export declare const file_${file.name.replace(/-/g, '_')}: DescFile;`);
    }
}

export const protocGenTrezorValidate = createEcmaScriptPlugin({
    name: '@trezor/protobuf/protoc-get-plugin',
    version: `v1`,
    parseOptions,
    generateTs,
    generateJs,
    generateDts,
});

runNodeJs(protocGenTrezorValidate);
