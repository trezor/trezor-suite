import * as fs from 'fs';
import * as path from 'path';

import { TestDetailsAnnotation, TestMetadataInput, createTestAnnotation } from '@trezor/e2e-utils';

const METADATA_DIR = path.join(process.cwd(), '.metadata');
const safeName = (name: string): string => Buffer.from(name).toString('base64'); // Avoid filesystem issues
export const filePath = (testName: string) => path.join(METADATA_DIR, `${safeName(testName)}.json`);

function ensureMetadataDir() {
    if (!fs.existsSync(METADATA_DIR)) {
        fs.mkdirSync(METADATA_DIR, { recursive: true });
    }
}

export function writeMetadata(testName: string, metadata: TestMetadataInput) {
    ensureMetadataDir();
    fs.writeFileSync(filePath(testName), JSON.stringify(createTestAnnotation(metadata), null, 2));
}

export function readMetadataForTest(testName: string): TestDetailsAnnotation[] {
    try {
        const raw = fs.readFileSync(filePath(testName), 'utf-8');

        return JSON.parse(raw);
    } catch {
        return [];
    }
}
