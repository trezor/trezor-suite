/* eslint-disable no-console */
import { mkdir, stat, writeFile } from 'fs/promises';
import { join, resolve } from 'path';

function getFileType(swaggerUrl: string) {
    const fileType = swaggerUrl.split('.').pop();

    switch (fileType) {
        case 'json':
            return 'json';
        case 'yaml':
        case 'yml':
            return 'yaml';
        default:
            return null;
    }
}

async function fetchSpec(
    swaggerUrl: string,
    fileType: NonNullable<ReturnType<typeof getFileType>>,
) {
    const response = await fetch(swaggerUrl, {
        headers: {
            Accept: fileType === 'json' ? 'application/json' : 'application/yaml',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch spec: ${response.statusText}`);
    }

    return await response.text();
}

export const OPENAPI_DIR = resolve(process.cwd(), './src/stake/api/openapi');

export const OPENAPI_SPECS = [
    {
        src: 'https://swagger.eth-api-b2c.everstake.one/swagger.json',
        name: 'everstake-eth-b2c.json',
    },
] as const satisfies {
    src: string;
    name: string;
}[];

async function updateSpec() {
    for (const { src, name } of OPENAPI_SPECS) {
        console.log(`⏳ Fetching ${src} API spec...`);
        const fileType = getFileType(src);

        if (fileType === null) {
            throw new Error(
                `Unsupported file type for ${src}: ${src}. Use .json or .yaml extension.`,
            );
        }

        if (!(await stat(OPENAPI_DIR)).isDirectory()) {
            await mkdir(OPENAPI_DIR, { recursive: true });
        }

        const specPath = join(OPENAPI_DIR, name);

        console.log(`⏳ Saving ${name} API spec to ${specPath}`);

        const specContent = await fetchSpec(src, fileType);
        await writeFile(specPath, specContent, 'utf-8');

        console.log(`✅ ${name} API spec updated successfully`);
    }
}

updateSpec().catch(console.error);
