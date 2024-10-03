/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import * as protobuf from 'protobufjs';

const SRC = path.join(__dirname, '../../../submodules/trezor-common/protob');
const DIST = path.join(__dirname, '../');
const SKIP_PACKAGE = ['monero2'];

type Def = {
    reserved?: any[];
    options?: Record<string, unknown>;
    type?: string;
    nested?: Record<string, Def>;
    fields?: Record<string, Def>;
}

const modifyDefinitionsJSON = (def: Def) => {
    // remove "reserved" fields
    delete def.reserved;

    // remove "options"
    const keepOptions = ['default', 'deprecated'];
    if (def.options) {
        const options = Object.keys(def.options);
        const opts = options.filter(opt => keepOptions.includes(opt)).reduce((prev, curr) => {
            prev[curr] = def.options?.[curr];

            return prev;
        }, {});

        if (Object.keys(opts).length < 1) {
            delete def.options;
        }
    }

    // replace types pointing to different packages, like "hw.trezor.messages.common"
    if (def.type && def.type.includes('.')) {
        def.type = def.type.split('.').pop();
    }
    
    // do it recursively for nested types and fields
    if (def.nested) {
        Object.values(def.nested).forEach(modifyDefinitionsJSON);
    }

    if (def.fields) {
        Object.values(def.fields).forEach(modifyDefinitionsJSON);
    }
};

const buildDefinitions = () => {
    // https://github.com/protobufjs/protobuf.js/blob/master/README.md#compatibility
    // Because the internals of this package do not rely on google/protobuf/descriptor.proto, options are parsed and presented literally.
    const r = new protobuf.Root({
        common: protobuf.common('descriptor', {}),
    });

    const files: string[] = [];
    const packages: string[] = [];
    // read all messages*.proto files
    fs.readdirSync(SRC).forEach(fileName => {
        if (!/^messages.*.proto$/.test(fileName)) {
            return;
        }
        // messages.proto file == empty pkg
        const pkg = fileName.replace(/messages-?(.+)?.proto$/, '$1').replace('-', '_');
        const isSkipped = SKIP_PACKAGE.includes(pkg);
        if (isSkipped) {
            return;
        }
    
        if (pkg) {
            packages.push(pkg);
        }
        files.push(path.join(SRC, fileName));
    });

    console.log("Loading files:", files);
    console.log("Packages:", packages);

    const root = r.loadSync(files, { keepCase: true });
    const result = {};
    packages.forEach(p => {
        const pkg = root.lookup(`hw.trezor.messages.${p}`);
        if (!pkg) {
            throw new Error(`hw.trezor.messages.${p} not found`);
        }
        const json = pkg.toJSON();
        Object.assign(result, json.nested);
    });

    const messages = root.lookup('hw.trezor.messages');
    if (!messages) {
        throw new Error('hw.trezor.messages not found');
    }
    // @ts-expect-error typed as protobuf.Reflection but its protobuf.Namespace
    const topLevelMessages = messages.nested;
    Object.keys(topLevelMessages).forEach(name => {
        if (!packages.includes(name)) {
            Object.assign(result, { [name]: topLevelMessages[name].toJSON() });
        }
    });

    modifyDefinitionsJSON({ nested: result });

    fs.writeFile(`${DIST}/messages.json`, JSON.stringify(result, null, 2), err => {
        if (err) return console.error(err);
    });

    const lines: string[] = [];
    lines.push('// This file is auto generated from ./thp.proto');
    lines.push('');

    lines.push(`export const getThpProtobufMessages = () => { return ${JSON.stringify(result)}; };`);
    lines.push('');

    fs.writeFile(`${DIST}/protobufDefinitions.ts`, lines.join('\n'), err => {
        if (err) return console.error(err);
    });
}

buildDefinitions();

