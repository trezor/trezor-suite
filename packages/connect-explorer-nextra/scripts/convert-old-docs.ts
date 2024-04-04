import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function convertFile(filename: string) {
    console.log('');
    const oldFile = fs.readFileSync(
        path.join(__dirname, `../../../docs/packages/connect/methods/${filename}.md`),
        'utf-8',
    );
    if (!oldFile || oldFile === null) {
        throw new Error(`File not found: ${filename}.md`);
    }

    const title = oldFile.match(/## (.*)/)?.[1];
    const method = oldFile.match(/TrezorConnect\.(\w*)\(/)?.[1];
    if (!title || !method) {
        console.error('Title or method not found:', title, method, filename);

        return;
    }

    const subdirectories = [
        'binance',
        'bitcoin',
        'cardano',
        'eos',
        'ethereum',
        'nem',
        'ripple',
        'solana',
        'stellar',
        'tezos',
        'blockchain',
        'device',
    ];
    let subdirectory = subdirectories.find(d => filename.startsWith(d)) ?? '.';
    if (
        [
            'composeTransaction',
            'getPublicKey',
            'getAddress',
            'getAccountInfo',
            'signTransaction',
            'pushTransaction',
            'signMessage',
            'verifyMessage',
        ].includes(method)
    ) {
        subdirectory = 'bitcoin';
    } else if (
        [
            'applySettings',
            'applyFlags',
            'backupDevice',
            'changeLanguage',
            'changePin',
            'changeWipeCode',
            'rebootToBootloader',
            'firmwareUpdate',
            'getFeatures',
            'recoveryDevice',
            'resetDevice',
            'wipeDevice',
        ].includes(method)
    ) {
        subdirectory = 'device';
    }
    if (!subdirectory) {
        subdirectory = 'other';
    }

    console.log('Title:', title);
    console.log('Method:', method);

    // Find types from file that has the type definition
    const typeDefPath = path.join(
        __dirname,
        `../../../packages/connect/src/types/api/${method}.ts`,
    );
    if (!fs.existsSync(typeDefPath)) {
        throw new Error(`Type definition not found: ${typeDefPath}`);
    }
    const typeDef = fs.readFileSync(typeDefPath, 'utf-8');
    const paramTypes = [...typeDef.matchAll(/ Params\<([^\>]*)\>/gims)]
        .map(m => m[1])
        .map(m => m.replace(/[\<\&].*/, '').trim());
    const bundledParamTypes = [...typeDef.matchAll(/ BundledParams\<([^\>]*)\>/gims)]
        .map(m => m[1])
        .map(m => m.replace(/[\<\&].*/, '').trim());
    paramTypes.push(...bundledParamTypes.map(m => `Bundle(${m})`));
    console.log('Params:', paramTypes);

    // Generate import types
    const importTypesList = [...typeDef.matchAll(/^import type {([^}]*)} from '([^;]*)';/gims)]
        .map(m => {
            // Filter only used imports
            const types = m?.[1]?.split(',')?.map(s => s.trim());
            const resolvedPath = path.join('@trezor/connect/src/types/api/', m?.[2]);
            const usedTypes = types?.filter(t =>
                [...paramTypes, ...bundledParamTypes].find(p => t === p.split('.')[0].trim()),
            );

            if (!usedTypes || usedTypes.length === 0) return null;

            return `import { ${usedTypes?.join(', ')} } from '${resolvedPath}';`;
        })
        .filter(m => m !== null);
    // Type defined in the same file
    const exportedFromFile = [...typeDef.matchAll(/^export type (.*) = /gim)]
        .map(m => m[1])
        .filter(t => paramTypes.find(p => t.includes(p.split('.')[0])));
    if (exportedFromFile.length > 0) {
        importTypesList?.push(
            `import { ${exportedFromFile.join(', ')} } from '@trezor/connect/src/types/api/${method}';`,
        );
    }

    // Prepare playground and params table
    let playground = '',
        paramsTable;
    if (paramTypes.length > 0) {
        const playgroundMethods = paramTypes
            .map(s => `{ title: '${s}', method: '${method}', schema: ${s} }`)
            .join(', ');
        const paramDescriptions = Object.fromEntries(
            [...oldFile.matchAll(/^-   \`([^`]*)\`:? [^`\n]*`([^`]*)?`[ ,\.]*(.*)$/gim)].map(m => [
                m[1],
                m[3].replace(/\.\.\/path\.md/g, '../details/path'),
            ]),
        );
        playground = `<ApiPlayground options={[${playgroundMethods}]} />`;
        playground += `\n\nexport const paramDescriptions = ${JSON.stringify(paramDescriptions, null, 4)};`;
        paramsTable = paramTypes
            .map(s => {
                if (s.startsWith('Bundle(')) {
                    return `#### ${s}\n\n<Param name="bundle" type="\`Array\` of Objects with above schema" />\n`;
                }

                return `#### ${s}\n\n<ParamsTable schema={${s}} descriptions={paramDescriptions} />\n`;
            })
            .join('\n');
    } else if (!['init'].includes(method)) {
        playground = `<ApiPlayground options={[{ title: 'No payload', method: '${method}' }]} />`;
    }

    let newFile = oldFile
        .replace(/^\> \:warning\: (.*)$/gim, (_, p1) => `<Callout type="warning">${p1}</Callout>`)
        .replace(/^\> \:note\: (.*)$/gim, (_, p1) => `<Callout type="info">${p1}</Callout>`)
        .replace('[Optional common params](commonParams.md)', '<CommonParamsLink />')
        .replace(/\.\.\/path\.md/g, '/details/path');
    if (paramsTable) {
        newFile = newFile.replace(
            /^\#\#\# Params(?:(?!^### ).)*/gims,
            `### Params\n<CommonParamsLink />\n\n${paramsTable}\n\n`,
        );
    }
    const localImportPath = subdirectory !== '.' ? '../../..' : `../..`;
    if (newFile.includes('</Callout>'))
        importTypesList?.push(`import { Callout } from 'nextra/components';`);
    if (bundledParamTypes.length > 0)
        importTypesList?.push(`import { Bundle } from '@trezor/connect/src/types';`);
    if (paramsTable?.includes('<Param '))
        importTypesList?.push(`import { Param } from '${localImportPath}/components/Param';`);
    if (paramsTable?.includes('<ParamsTable '))
        importTypesList?.push(
            `import { ParamsTable } from '${localImportPath}/components/ParamsTable';`,
        );
    if (newFile?.includes('<CommonParamsLink '))
        importTypesList?.push(
            `import { CommonParamsLink } from '${localImportPath}/components/CommonParamsLink';`,
        );
    if (playground)
        importTypesList?.push(
            `import { ApiPlayground } from '${localImportPath}/components/ApiPlayground';`,
        );
    const importTypes = importTypesList?.join('\n')?.replace(/import type/g, 'import');

    const output = `
${importTypes}

${playground}

${newFile}
`;

    if (subdirectory) {
        fs.mkdirSync(path.join(__dirname, `../src/pages/methods/`, subdirectory), {
            recursive: true,
        });
    }
    const outputPath = path.join(
        __dirname,
        `../src/pages/methods/`,
        subdirectory,
        `/${filename}.mdx`,
    );
    fs.writeFileSync(outputPath, output);

    // Format the file and check with eslint
    try {
        execSync(`yarn g:eslint --fix ${outputPath}`);
        execSync(`yarn g:prettier --write ${outputPath}`);
    } catch (error) {
        console.error('Error while formatting the file:', error.message);
        console.error(error.output?.[1]?.toString());
        //fs.unlinkSync(outputPath);
    }
}

function convertAll() {
    const files = fs.readdirSync(path.join(__dirname, '../../../docs/packages/connect/methods'));
    files.forEach(file => {
        if (!file.endsWith('.md')) return;
        const filename = file.replace('.md', '');
        convertFile(filename);
    });
}

const filename = process.argv[2];
if (filename === '--all') {
    convertAll();
} else {
    convertFile(filename);
}
