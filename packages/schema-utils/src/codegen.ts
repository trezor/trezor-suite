import * as Codegen from '@sinclair/typebox-codegen/typescript';
import fs from 'fs';

export function generate(code: string) {
    // Make some replacements to make the code processable by the generator
    // Since there are some issues with typeof
    code = code.replace(/typeof undefined/g, 'undefined');
    code = code.replace(/keyof typeof/g, 'keyof');
    // Ignore types added at end of message.ts, these are too complex for the generator
    if (code.indexOf('export type MessageKey = keyof MessageType') >= 0) {
        code = code.substring(0, code.indexOf('export type MessageKey = keyof MessageType'));
    }
    // Make generator aware of custom types
    const customTypesMapping = {
        ArrayBuffer: 'Type.ArrayBuffer()',
        Buffer: 'Type.Buffer()',
        UintType: 'Type.Uint()',
        SintType: 'Type.Uint({ allowNegative: true })',
    };
    const customTypePlaceholder = Object.keys(customTypesMapping).map(t => `type ${t} = any;`);
    // Run generator
    let output = Codegen.TypeScriptToTypeBox.Generate(customTypePlaceholder + code, {
        useTypeBoxImport: false,
    });
    // Remove placeholder declarations of custom types
    const lastKey = Object.keys(customTypesMapping)[Object.keys(customTypesMapping).length - 1];
    const index = output.lastIndexOf(`const ${lastKey} = `);
    const blankLineIndex = output.indexOf('\n\n', index);
    output = output.substring(blankLineIndex + 1);
    // Replace placeholder types with custom types mapping
    Object.entries(customTypesMapping).forEach(([key, value]) => {
        output = output.replace(new RegExp(`\\b${key}\\b`, 'g'), value);
    });
    // Find enum occurences
    const enums = [...output.matchAll(/enum Enum(\w+) {/g)].map(m => m[1]);
    // Replace possible keyof for each enum
    enums.forEach(e => {
        // Replace all occurences of version without Enum prefix with version with Enum prefix
        output = output.replace(new RegExp(`\\b${e}\\b`, 'g'), `Enum${e}`);
        output = output.replace(
            new RegExp(`type Enum${e} = Static\\<typeof Enum${e}\\>`, 'g'),
            `type Enum${e} = Static<typeof Enum${e}>`,
        );
        output = output.replace(
            new RegExp(`const Enum${e} = Type\\.Enum\\(Enum${e}\\)`, 'g'),
            `const Enum${e} = Type.Enum(${e})`,
        );
        output = output.replace(new RegExp(`enum Enum${e} \\{`, 'g'), `enum ${e} {`);
        output = output.replace(
            new RegExp(`Type\\.KeyOf\\(Enum${e}\\)`, 'g'),
            `Type.KeyOfEnum(${e})`,
        );
    });
    // Add import of lib
    output = `import { Type, Static } from '@trezor/schema-utils';\n\n${output}`;
    // Add eslint ignore for camelcase, since some type names use underscores
    output = `/* eslint-disable camelcase */\n${output}`;
    // Add types for message schema
    if (output.indexOf('export type MessageType =') > -1) {
        output = `${output}\n
// custom type uint32/64 may be represented as string
export type UintType = string | number;

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
`;
    }
    return output;
}

export function generateForFile(fileName: string) {
    const code = fs.readFileSync(fileName, 'utf-8');
    return generate(code);
}

// If ran directly, output code for file passed as argument
/* istanbul ignore next */
if (require.main === module) {
    const fileName = process.argv[2];
    if (!fileName || !fs.existsSync(fileName)) {
        throw new Error('File not found');
    }
    const output = generateForFile(fileName);
    process.stdout.write(output);
}
