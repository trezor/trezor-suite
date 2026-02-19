/**
 * Converts event name (e.g. "connect-popup/init") to the variable/file base name (e.g. "connectPopupInitEvent").
 */
export const eventNameToFileBaseName = (eventName: string): string => {
    const segments = eventName.split(/[/_-]/).filter(Boolean);
    if (segments.length === 0) return 'event';
    const camel = segments
        .map((s, i) =>
            i === 0 ? s.toLowerCase() : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(),
        )
        .join('');

    return `${camel}Event`;
};

/**
 * Converts event name to suggested enum key for constants (e.g. "connect-popup/init" -> "ConnectPopupInit").
 */
export const eventNameToEnumKey = (eventName: string): string => {
    const segments = eventName.split(/[/_-]/).filter(Boolean);

    return segments.map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join('');
};

const PLATFORM_TO_PACKAGE_DIR: Record<string, string> = {
    desktop: 'suite/analytics',
    mobile: 'suite-native/analytics',
    shared: 'suite-common/analytics',
};

/**
 * Returns suggested line to add to EventType enum in constants.ts (e.g. "ConnectPopupInit = 'connect-popup/init'").
 */
export const getEnumAdditionSnippet = (eventName: string): string => {
    const key = eventNameToEnumKey(eventName);

    return `    ${key} = '${eventName}',`;
};

/**
 * Returns the relative path (from repo root) where the event file should live.
 */
export const getEventFilePath = (platform: string, eventName: string): string => {
    const dir = PLATFORM_TO_PACKAGE_DIR[platform] ?? 'suite-common/analytics';
    const fileName = `${eventNameToFileBaseName(eventName)}.ts`;

    return `${dir}/src/events/${fileName}`;
};

/**
 * Returns the relative path (from repo root) to the analytics constants.ts for the given platform.
 */
export const getConstantsFilePath = (platform: string): string => {
    const dir = PLATFORM_TO_PACKAGE_DIR[platform] ?? 'suite-common/analytics';

    return `${dir}/src/constants.ts`;
};

/** AppVersion: either "x.y.z" (e.g. 26.2.0) or "?" */
export const APP_VERSION_REGEX = /^(\d+\.\d+\.\d+|\?)$/;

/**
 * Default version for new changelog entries: YY.(MM)+1.0 (e.g. Feb 2026 → 26.3.0, Dec 2026 → 27.1.0).
 */
export const getDefaultVersion = (): string => {
    const now = new Date();
    const year = now.getFullYear() % 100;
    const month = now.getMonth() + 1; // 1–12
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    return `${nextYear.toString().padStart(2, '0')}.${nextMonth}.0`;
};

export const isValidAppVersion = (version: string): boolean =>
    version.trim() !== '' && APP_VERSION_REGEX.test(version.trim());

/** Returns error key: no entry, invalid version, or empty notes. */
export const getChangelogErrorMessage = (
    entries: EventFormChangelogEntry[],
): 'no_entry' | 'invalid_version' | 'empty_notes' | null => {
    if (entries.length === 0) return 'no_entry';
    const hasValidVersionAndNotes = entries.some(
        e => isValidAppVersion(e.version) && e.notes.trim() !== '',
    );
    if (hasValidVersionAndNotes) return null;
    const hasValidVersion = entries.some(e => isValidAppVersion(e.version));
    if (hasValidVersion) return 'empty_notes'; // valid version but notes missing
    const hasTypedVersion = entries.some(e => e.version.trim() !== '');

    return hasTypedVersion ? 'invalid_version' : 'no_entry';
};

export type EventFormChangelogEntry = { version: string; notes: string };

export type EventFormAttribute = {
    key: string;
    description: string;
    runtimeType: string;
    isOptional: boolean;
    changelog: EventFormChangelogEntry[];
};

export type EventFormState = {
    eventName: string;
    platform: string;
    descriptionTrigger: string;
    description: string;
    possibleImprovements: string;
    changelog: EventFormChangelogEntry[];
    attributes: EventFormAttribute[];
};

export type EventDocLike = {
    name: string;
    platform: string;
    descriptionTrigger?: string;
    description?: string;
    possibleImprovements?: string;
    changelog?: { entries?: Array<{ version: string; notes: string }> };
    attributes?: Record<
        string,
        {
            description?: string;
            runtimeType?: string;
            changelog?: { entries?: Array<{ version: string; notes: string }> };
        }
    >;
};

const withDefaultVersion = (version: string): string =>
    version.trim() === '' ? getDefaultVersion() : version;

export const eventDocToFormState = (doc: EventDocLike): EventFormState => ({
    eventName: doc.name,
    platform: doc.platform || 'shared',
    descriptionTrigger: doc.descriptionTrigger ?? '',
    description: doc.description ?? '',
    possibleImprovements: doc.possibleImprovements ?? '',
    changelog: (doc.changelog?.entries ?? [{ version: '', notes: '' }]).map(e => ({
        version: withDefaultVersion(e.version),
        notes: e.notes ?? '',
    })),
    attributes:
        Object.entries(doc.attributes ?? {}).length > 0
            ? Object.entries(doc.attributes ?? {}).map(([key, attr]) => ({
                  key,
                  description: attr.description ?? '',
                  runtimeType: attr.runtimeType ?? '',
                  isOptional: false,
                  changelog: (attr.changelog?.entries ?? [{ version: '', notes: '' }]).map(e => ({
                      version: withDefaultVersion(e.version),
                      notes: e.notes ?? '',
                  })),
              }))
            : [],
});

export const createEmptyFormState = (): EventFormState => ({
    eventName: '',
    platform: 'shared',
    descriptionTrigger: '',
    description: '',
    possibleImprovements: '',
    changelog: [{ version: getDefaultVersion(), notes: '' }],
    attributes: [],
});

/**
 * Converts double-quoted string literals in a type string to single-quoted for generated output.
 */
const typeDoubleQuotesToSingle = (typeStr: string): string =>
    typeStr.replace(/"((?:[^"\\]|\\.)*)"/g, (_, inner) => {
        const escaped = inner.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        return `'${escaped}'`;
    });

/**
 * Generates TypeScript source for an analytics event file from form state.
 */
export const generateEventFileContent = (state: EventFormState): string => {
    const fileBaseName = eventNameToFileBaseName(state.eventName);
    const enumKey = eventNameToEnumKey(state.eventName);

    const hasAttributes = state.attributes.length > 0;
    const attrEntries = state.attributes
        .filter(a => a.key.trim() !== '')
        .map(a => {
            const optional =
                a.isOptional || a.runtimeType.includes('|') || a.key.startsWith('optional');
            const key = a.key.replace(/^optional\s*/i, '').trim() || a.key.trim();
            const typeParam = typeDoubleQuotesToSingle(a.runtimeType.trim() || 'unknown');
            const optionalMark = optional ? '?' : '';

            return `    ${key}${optionalMark}: AttributeDef<${typeParam}>;`;
        });

    const attributesType =
        attrEntries.length > 0
            ? `type Attributes = {\n${attrEntries.join('\n')}\n};`
            : 'type Attributes = {};';

    const changelogLines = state.changelog
        .filter(e => e.version.trim())
        .map(
            e =>
                `    { version: '${e.version.replace(/'/g, "\\'")}', notes: '${e.notes.replace(/'/g, "\\'")}' },`,
        )
        .join('\n');
    const changelogBlock =
        changelogLines.length > 0
            ? `changelog: [\n${changelogLines}\n    ],`
            : "changelog: [{ version: '?', notes: 'added' }],";

    const eventDesc = state.descriptionTrigger
        ? `descriptionTrigger: '${state.descriptionTrigger.replace(/'/g, "\\'")}',`
        : "descriptionTrigger: '',";
    const descriptionLine = state.description.trim()
        ? `\n    description: '${state.description.trim().replace(/'/g, "\\'")}',`
        : '';
    const possibleImprovementsLine = state.possibleImprovements.trim()
        ? `\n    possibleImprovements: '${state.possibleImprovements.trim().replace(/'/g, "\\'")}',`
        : '';

    const attributesBlock = hasAttributes
        ? state.attributes
              .filter(a => a.key.trim() !== '')
              .map(attr => {
                  const key = attr.key.replace(/^optional\s*/i, '').trim() || attr.key.trim();
                  const attrChangelog = attr.changelog
                      .filter(e => e.version.trim())
                      .map(
                          e =>
                              `            { version: '${e.version.replace(/'/g, "\\'")}', notes: '${e.notes.replace(/'/g, "\\'")}' },`,
                      )
                      .join('\n');
                  const attrChangelogBlock =
                      attrChangelog.length > 0
                          ? `changelog: [\n${attrChangelog}\n            ],`
                          : "changelog: [{ version: '?', notes: 'added' }],";
                  const attrDesc = attr.description.trim()
                      ? `\n        description: '${attr.description.trim().replace(/'/g, "\\'")}',`
                      : '';

                  return `        ${key}: {\n        ${attrChangelogBlock}${attrDesc}\n        },`;
              })
              .join('\n')
        : '';

    const isShared = state.platform === 'shared';
    const imports = isShared
        ? "import { EventType } from '../constants';\nimport type { AttributeDef, EventDef } from '../eventDefinition';"
        : "import type { AttributeDef, EventDef } from '@suite-common/analytics';\n\nimport { EventType } from '../constants';";

    const eventTypeRef = `EventType.${enumKey}`;
    const exportName = fileBaseName;

    const lines = [
        imports,
        '',
        attributesType,
        '',
        `export const ${exportName}: EventDef<Attributes, ${eventTypeRef}> = {`,
        `    name: ${eventTypeRef},`,
        `    ${eventDesc}${descriptionLine}${possibleImprovementsLine}`,
        `    ${changelogBlock}`,
        ...(hasAttributes ? ['', '    attributes: {', attributesBlock || '', '    },'] : []),
        '};',
    ];

    return lines.join('\n');
};
