import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

import { methodsWithConditionalDevice, methodsWithoutDevice } from '@trezor/connect-common';

/**
 * `@trezor/connect-common` publishes which methods need the device so hosts can decide, before
 * dispatching, whether to serialize a call. That list is hand-written because the real value is
 * assigned inside each method's constructor and is not reachable without valid params.
 *
 * These tests read the implementations instead, so adding a method that opts out of the device
 * fails here until the published list is updated. Without them the two copies drift silently,
 * which is exactly how `blockchainGetContractInfo` ended up blocking Suite's UI for minutes.
 */
const API_DIR = __dirname;

const collectMethodSources = (directory: string): Record<string, string> =>
    readdirSync(directory, { withFileTypes: true }).reduce<Record<string, string>>(
        (sources, entry) => {
            const path = join(directory, entry.name);

            if (entry.isDirectory()) {
                return { ...sources, ...collectMethodSources(path) };
            }

            if (!entry.name.endsWith('.ts') || entry.name.endsWith('.test.ts')) {
                return sources;
            }

            return { ...sources, [entry.name.replace(/\.ts$/, '')]: readFileSync(path, 'utf8') };
        },
        {},
    );

const sources = collectMethodSources(API_DIR);

const methodsAssigning = (pattern: RegExp) =>
    Object.entries(sources)
        .filter(([, source]) => pattern.test(source))
        .map(([method]) => method)
        .sort();

describe('methodUsesDevice', () => {
    it('lists every method that opts out of the device', () => {
        expect(methodsAssigning(/this\.useDevice = false/)).toEqual(
            [...methodsWithoutDevice].sort(),
        );
    });

    it('handles every method that decides per call', () => {
        const conditional = methodsAssigning(/this\.useDevice = (?!true\b|false\b)/);

        expect(conditional).toEqual([...methodsWithConditionalDevice].sort());
    });
});
