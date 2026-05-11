import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import type { EventDef } from '@suite-common/analytics';
import { unique } from '@trezor/utils';

import type { EventDoc } from '../src/types';
import {
    AttributeTypesByEventName,
    extractAttributeTypesByEventName,
    findPackageRoot,
    findUp,
} from '../src/utils/extractAttributeTypes';
import { normalizeChangelog } from '../src/utils/normalizeChangelog';
import { normalizeEvents } from '../src/utils/normalizeEvents';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cjsRequire = createRequire(import.meta.url);
const repoRoot = path.resolve(__dirname, '../../..');

const PACKAGES = [
    '@suite-common/analytics',
    '@suite/analytics',
    '@suite-native/analytics',
] as const;

const PACKAGE_TO_PLATFORM: Record<(typeof PACKAGES)[number], string> = {
    '@suite-common/analytics': 'shared',
    '@suite/analytics': 'desktop',
    '@suite-native/analytics': 'mobile',
};

/** Paths from repo root for packages we don't depend on (to avoid cyclic deps). */
const PACKAGE_TO_REL_PATH: Partial<Record<(typeof PACKAGES)[number], string>> = {
    '@suite/analytics': 'suite/analytics',
    '@suite-native/analytics': 'suite-native/analytics',
};

const getPackageRoot = (packageName: (typeof PACKAGES)[number]): string => {
    const relPath = PACKAGE_TO_REL_PATH[packageName];
    if (relPath) {
        return path.join(repoRoot, relPath);
    }

    return path.dirname(cjsRequire.resolve(`${packageName}/package.json`));
};

const loadEventsFromPackage = async (
    packageName: (typeof PACKAGES)[number],
): Promise<Array<EventDef<unknown, string>>> => {
    const packageRoot = getPackageRoot(packageName);
    const eventsPath = path.join(packageRoot, 'src', 'events', 'index.ts');
    const module = await import(pathToFileURL(eventsPath).href);

    return Object.values(module) as Array<EventDef<unknown, string>>;
};

const loadAllEvents = async (): Promise<
    Array<EventDef<unknown, string> & { platform: string }>
> => {
    const results = await Promise.all(
        PACKAGES.map(async packageName => {
            const events = await loadEventsFromPackage(packageName);
            const platform = PACKAGE_TO_PLATFORM[packageName];

            return events.map(event => ({ ...event, platform }));
        }),
    );

    return results.flat();
};

const getTsConfigPath = (): string => {
    const docgenPath = path.resolve(__dirname, '../tsconfig.docgen.json');
    if (fs.existsSync(docgenPath)) return docgenPath;
    const up = findUp('tsconfig.json', path.resolve(__dirname, '..'));

    return up ?? path.resolve(repoRoot, 'tsconfig.json');
};

const getPackageRoots = (): string[] => {
    const roots = PACKAGES.map(name =>
        findPackageRoot(path.join(getPackageRoot(name), 'package.json')),
    ).filter((x): x is string => Boolean(x));

    return unique(roots);
};

const getEventFileGlobs = (packageRoots: string[]): string[] =>
    packageRoots.flatMap(root => [
        path.join(root, 'src/**/*.{ts,tsx}'),
        path.join(root, 'dist/**/*.d.ts'),
    ]);

/** Adds attribute docs for type-only keys (e.g. Record<string, number>) so runtimeType can be merged. */
const ensureAttributeDocsFromTypes = (
    events: Record<string, EventDoc>,
    attributeTypesByEventName: AttributeTypesByEventName,
): void => {
    for (const [eventName, eventDoc] of Object.entries(events)) {
        const eventTypes = attributeTypesByEventName[eventName];
        if (!eventTypes) continue;

        for (const attrName of Object.keys(eventTypes)) {
            if (attrName in eventDoc.attributes) continue;
            eventDoc.attributes[attrName] = {
                changelog: eventDoc.changelog ?? normalizeChangelog(),
            };
        }
    }
};

const mergeRuntimeTypes = (
    events: Record<string, EventDoc>,
    attributeTypesByEventName: AttributeTypesByEventName,
): void => {
    for (const [eventName, eventDoc] of Object.entries(events)) {
        const eventTypes = attributeTypesByEventName[eventName];
        if (!eventTypes) continue;

        for (const [attrName, attrDoc] of Object.entries(eventDoc.attributes)) {
            const runtimeType = eventTypes[attrName];
            if (runtimeType) attrDoc.runtimeType = runtimeType;
        }
    }
};

const writeOutput = (
    data: { events: Record<string, EventDoc>; generatedAt: string },
    outputPath: string,
): void => {
    const pretty = process.env.PRETTY_ANALYTICS_JSON === '1';
    const json = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    fs.writeFileSync(outputPath, json, 'utf-8');
};

const run = async () => {
    const allEvents = await loadAllEvents();
    const normalizedEvents = normalizeEvents(allEvents);

    const tsConfigPath = getTsConfigPath();
    const packageRoots = getPackageRoots();
    const eventFileGlobs = getEventFileGlobs(packageRoots);

    const attributeTypesByEventName = extractAttributeTypesByEventName({
        tsConfigFilePath: tsConfigPath,
        eventFileGlobs,
    });

    ensureAttributeDocsFromTypes(normalizedEvents, attributeTypesByEventName);
    mergeRuntimeTypes(normalizedEvents, attributeTypesByEventName);

    const publicDir = path.resolve(__dirname, '../public');
    fs.mkdirSync(publicDir, { recursive: true });
    const outputPath = path.join(publicDir, 'analytics.json');
    const generatedAt = new Date().toISOString();
    writeOutput({ events: normalizedEvents, generatedAt }, outputPath);

    // eslint-disable-next-line no-console
    console.log(
        `[analytics-docs] analytics.json generated (${Object.keys(normalizedEvents).length} events)`,
    );
};

void run();
