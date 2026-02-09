import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as desktopEvents from '@suite/analytics';
import * as sharedEvents from '@suite-common/analytics';
import * as mobileEvents from '@suite-native/analytics';

import { extractAttributeTypesByEventName, findPackageRoot, findUp } from './extractAttributeTypes';
import { normalizeEvents } from '../src/normalizeEvents';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '../../..');

const require = createRequire(import.meta.url);

const docgenTsconfig = path.resolve(__dirname, '../tsconfig.docgen.json');
const tsConfigFilePath = fs.existsSync(docgenTsconfig)
    ? docgenTsconfig
    : (findUp('tsconfig.json', path.resolve(__dirname, '..')) ??
      path.resolve(repoRoot, 'tsconfig.json'));

const withPlatform = <T extends Record<string, any>>(events: T, platform: string) =>
    Object.values(events).map(event => ({
        ...event,
        platform,
    }));

const eventsArray = [
    ...withPlatform(sharedEvents.events, 'shared'),
    ...withPlatform(desktopEvents.events, 'desktop'),
    ...withPlatform(mobileEvents.events, 'mobile'),
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

// eslint-disable-next-line no-console
console.log(
    '[analytics-docs] attributeTypes events:',
    Object.keys(attributeTypesByEventName).length,
);
// eslint-disable-next-line no-console
console.log(
    '[analytics-docs] attributeTypes sample:',
    Object.keys(attributeTypesByEventName).slice(0, 5),
);
// eslint-disable-next-line no-console
console.log('[analytics-docs] normalizedEvents sample:', Object.keys(normalizedEvents).slice(0, 5));

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

fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf-8');

// eslint-disable-next-line no-console
console.log(`[analytics-docs] analytics.json generated (${eventsCount} events)`);
