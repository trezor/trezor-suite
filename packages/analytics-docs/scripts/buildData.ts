import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { EventDef } from '@suite-common/analytics';

import { extractAttributeTypesByEventName, findPackageRoot, findUp } from './extractAttributeTypes';
import { normalizeEvents } from '../src/utils/normalizeEvents';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '../../..');

const require = createRequire(import.meta.url);

/** Load events module directly from package src/events/index.ts (Node ESM does not resolve ./events to index.ts). */
const loadEventsFromPackage = async (
    packageName: string,
): Promise<Array<EventDef<unknown, string>>> => {
    const packageRoot = path.dirname(require.resolve(`${packageName}/package.json`));
    const eventsPath = path.join(packageRoot, 'src', 'events', 'index.ts');
    const module = await import(pathToFileURL(eventsPath).href);

    return Object.values(module) as Array<EventDef<unknown, string>>;
};

const docgenTsconfig = path.resolve(__dirname, '../tsconfig.docgen.json');
const tsConfigFilePath = fs.existsSync(docgenTsconfig)
    ? docgenTsconfig
    : (findUp('tsconfig.json', path.resolve(__dirname, '..')) ??
      path.resolve(repoRoot, 'tsconfig.json'));

const withPlatform = (
    events: Array<EventDef<unknown, string>>,
    platform: string,
): Array<EventDef<unknown, string> & { platform: string }> =>
    events.map(event => ({
        ...event,
        platform,
    }));

const [sharedEventsList, desktopEventsList, mobileEventsList] = await Promise.all([
    loadEventsFromPackage('@suite-common/analytics'),
    loadEventsFromPackage('@suite/analytics'),
    loadEventsFromPackage('@suite-native/analytics'),
]);

const eventsArray = [
    ...withPlatform(sharedEventsList, 'shared'),
    ...withPlatform(desktopEventsList, 'desktop'),
    ...withPlatform(mobileEventsList, 'mobile'),
];

const normalizedEvents = normalizeEvents(eventsArray);

const entrypoints = [
    require.resolve('@suite-common/analytics'),
    require.resolve('@suite/analytics'),
    require.resolve('@suite-native/analytics/src/events'),
];

const packageRoots = Array.from(
    new Set(entrypoints.map(p => findPackageRoot(p)).filter((x): x is string => Boolean(x))),
);

// eslint-disable-next-line no-console
console.log('[analytics-docs] tsconfig used:', tsConfigFilePath);
// eslint-disable-next-line no-console
console.log('[analytics-docs] package roots:', packageRoots);

const eventFileGlobs = packageRoots.flatMap(root => [
    path.join(root, 'src/**/*.{ts,tsx}'),
    path.join(root, 'dist/**/*.d.ts'),
]);

const attributeTypesByEventName = extractAttributeTypesByEventName({
    tsConfigFilePath,
    eventFileGlobs,
});

let filled = 0;
let missing = 0;

for (const [eventName, eventDoc] of Object.entries(normalizedEvents)) {
    const eventTypes = attributeTypesByEventName[eventName];
    if (!eventTypes) continue;

    for (const [attrName, attrDoc] of Object.entries(eventDoc.attributes)) {
        const t = eventTypes[attrName];
        if (!t) {
            missing++;
            continue;
        }
        attrDoc.runtimeType = t;
        filled++;
    }
}

// eslint-disable-next-line no-console
console.log(`[analytics-docs] runtimeType filled: ${filled}, missing: ${missing}`);

const data = {
    events: normalizedEvents,
};

const eventsCount = Object.keys(normalizedEvents).length;

const outputPath = path.resolve(__dirname, '../src/analytics.json');

// Compact JSON (no pretty-print) reduces file size significantly for large event sets.
// Use PRETTY_ANALYTICS_JSON=1 for development if you need to inspect the file.
const pretty = process.env.PRETTY_ANALYTICS_JSON === '1';
const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);

fs.writeFileSync(outputPath, json, 'utf-8');

// eslint-disable-next-line no-console
console.log(`[analytics-docs] analytics.json generated (${eventsCount} events)`);
