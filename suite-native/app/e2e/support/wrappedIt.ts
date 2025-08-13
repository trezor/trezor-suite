import * as fs from 'fs';
import * as path from 'path';

import { TestMetadataInput, createTestAnnotation } from '@trezor/e2e-utils';

type JestIt = typeof global.it;

interface ItWithMetadataFn {
    (name: string, fn: jest.ProvidesCallback, timeout?: number): void;
    (name: string, metadata: TestMetadataInput, fn: jest.ProvidesCallback, timeout?: number): void;
    skip: JestIt['skip'];
    only: JestIt['only'];
    concurrent: JestIt['concurrent'];
}

const METADATA_DIR = path.join(process.cwd(), '.metadata');

function ensureMetadataDir() {
    if (!fs.existsSync(METADATA_DIR)) {
        fs.mkdirSync(METADATA_DIR, { recursive: true });
    }
}

function writeMetadata(testName: string, metadata: TestMetadataInput) {
    ensureMetadataDir();
    const safeName = Buffer.from(testName).toString('base64'); // Avoid filesystem issues
    const filePath = path.join(METADATA_DIR, `${safeName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(createTestAnnotation(metadata), null, 2));
}

const wrappedIt = (
    name: string,
    metaOrFn: TestMetadataInput | jest.ProvidesCallback,
    fnOrTimeout?: jest.ProvidesCallback | number,
    maybeTimeout?: number,
) => {
    if (typeof metaOrFn === 'function') {
        const fn = metaOrFn;
        const timeout = fnOrTimeout as number | undefined;

        return global.it(name, fn, timeout);
    }

    const metadata = metaOrFn;
    const fn = fnOrTimeout as jest.ProvidesCallback;
    const timeout = maybeTimeout;

    writeMetadata(name, metadata);

    return global.it(name, fn, timeout);
};

(wrappedIt as ItWithMetadataFn).skip = globalThis.it.skip.bind(globalThis.it);
(wrappedIt as ItWithMetadataFn).only = globalThis.it.only.bind(globalThis.it);
(wrappedIt as ItWithMetadataFn).concurrent = globalThis.it.concurrent.bind(globalThis.it);

export const it: ItWithMetadataFn = wrappedIt as ItWithMetadataFn;
