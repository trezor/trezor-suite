/* eslint-disable no-console */
// @ts-check
import { writeFile } from 'fs/promises';
import { join } from 'path';

async function fetchSpec() {
    const response = await fetch('https://api.yield.xyz/docs.yaml', {
        headers: {
            Accept: 'application/yaml',
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch spec: ${response.statusText}`);
    }

    return await response.text();
}

async function updateSpec() {
    console.log('⏳ Fetching Yield XYZ API spec...');
    const specPath = join(process.cwd(), 'openapi.yaml');
    const spec = await fetchSpec();

    console.log('⏳ Saving Yield XYZ API spec to ', specPath);
    await writeFile(specPath, spec, 'utf-8');
    console.log('✅ Yield XYZ API spec updated successfully');
}

updateSpec().catch(console.error);
