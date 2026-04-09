import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Requirement } from '../Requirement';

const PACKAGE_JSON_FILE = 'package.json';

// Matches ./lib/... or ./libESM/... export keys with or without trailing wildcard
const LIB_EXPORT_KEY_PATTERN = /^\.\/(libESM|lib)(\/[^*]+)?(\/\*)?$/;

type ExportValue = string | ExportValueMap;

interface ExportValueMap {
    [key: string]: ExportValue;
}

type PackageJson = {
    readonly name?: string;
    readonly main?: string;
    readonly files?: ReadonlyArray<string>;
    readonly publishConfig?: {
        readonly main?: string;
        readonly types?: string;
        readonly exports?: ExportValueMap;
    };
};

const getExpectedExport = (exportKey: string): ExportValue | null => {
    if (exportKey === '.') {
        return {
            import: { types: './libESM/index.d.mts', default: './libESM/index.mjs' },
            require: { types: './lib/index.d.ts', default: './lib/index.js' },
        };
    }

    const match = LIB_EXPORT_KEY_PATTERN.exec(exportKey);
    if (!match) {
        return null;
    }

    const isEsm = match[1] === 'libESM';
    const isWildcard = match[3] === '/*';

    // Only wildcard entries have a predictable shape.
    // Explicit entries are intentional overrides (e.g. ./lib/subdir → ./lib/subdir/index.js).
    if (!isWildcard) {
        return null;
    }

    const basePath = exportKey.slice(0, -1);

    // ESM imports already include the .mjs extension, so the wildcard is a passthrough.
    if (isEsm) {
        return `${basePath}*`;
    }

    return { types: `${basePath}*.d.ts`, default: `${basePath}*.js` };
};

const validatePublicPackage = (packageJson: PackageJson): ReadonlyArray<string> => {
    const errors: string[] = [];
    const { publishConfig } = packageJson;

    if (!packageJson.main) {
        errors.push('Missing top-level "main" field');
    }

    if (!publishConfig?.main) {
        errors.push('Missing "publishConfig.main" field');
    }
    if (!publishConfig?.types) {
        errors.push('Missing "publishConfig.types" field');
    }

    const files = packageJson.files ?? [];
    if (!files.some(f => f === 'lib/' || f === 'lib')) {
        errors.push('"files" must include "lib/"');
    }
    if (!files.some(f => f === 'libESM/' || f === 'libESM')) {
        errors.push('"files" must include "libESM/"');
    }

    return errors;
};

// Checks that "types" comes before "default" in a condition object.
const validateKeyOrder = (obj: ExportValue, context: string): ReadonlyArray<string> => {
    const errors: string[] = [];
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        return errors;
    }

    const keys = Object.keys(obj);
    const typesIndex = keys.indexOf('types');
    const defaultIndex = keys.indexOf('default');
    if (defaultIndex !== -1 && typesIndex > defaultIndex) {
        errors.push(`In ${context}: "types" must come before "default"`);
    }

    for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            errors.push(...validateKeyOrder(value, `${context}.${key}`));
        }
    }

    return errors;
};

const validateExports = (
    exportsConfig: NonNullable<PackageJson['publishConfig']>['exports'],
): ReadonlyArray<string> => {
    const errors: string[] = [];
    if (!exportsConfig) {
        return ['Missing publishConfig.exports field'];
    }
    if (!exportsConfig['.']) {
        errors.push('Missing publishConfig.exports["."]');
    }

    for (const [exportKey, exportValue] of Object.entries(exportsConfig)) {
        // String values are passthrough exports (e.g. "./libESM/*": "./libESM/*") and are always accepted.
        const expectedValue = typeof exportValue !== 'string' ? getExpectedExport(exportKey) : null;
        if (
            expectedValue !== null &&
            JSON.stringify(exportValue) !== JSON.stringify(expectedValue)
        ) {
            errors.push(`Invalid publishConfig.exports[${JSON.stringify(exportKey)}]`);
            errors.push(`  Expected: ${JSON.stringify(expectedValue)}`);
            errors.push(`  Actual:   ${JSON.stringify(exportValue)}`);
        }

        const match = LIB_EXPORT_KEY_PATTERN.exec(exportKey);
        if (match) {
            const counterpart = exportKey.replace(
                /^\.\/(libESM|lib)/,
                match[1] === 'lib' ? './libESM' : './lib',
            );
            if (!(counterpart in exportsConfig)) {
                errors.push(
                    `Missing counterpart ${JSON.stringify(counterpart)} for ${JSON.stringify(exportKey)}`,
                );
            }
        }

        // Check key order for explicit overrides. shape-checked entries already enforce order via JSON.stringify.
        if (expectedValue === null) {
            errors.push(
                ...validateKeyOrder(
                    exportValue,
                    `publishConfig.exports[${JSON.stringify(exportKey)}]`,
                ),
            );
        }
    }

    return errors;
};

export const requirePublishConfig: Requirement<'workspace'> = {
    name: 'package-json-publishConfig',
    scope: 'workspace',
    applies: context => {
        const packageJsonPath = join(context.workspaceDir, PACKAGE_JSON_FILE);

        let parsed: PackageJson;
        try {
            parsed = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
        } catch {
            return false;
        }

        return parsed.publishConfig !== undefined;
    },
    verify: context => {
        const packageJsonPath = join(context.workspaceDir, PACKAGE_JSON_FILE);

        let parsed: PackageJson;
        try {
            parsed = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as PackageJson;
        } catch {
            return Promise.resolve([
                `${context.workspaceName}: ${PACKAGE_JSON_FILE} is missing or contains invalid JSON`,
            ]);
        }

        const errors: string[] = [];

        if (parsed.publishConfig) {
            for (const error of validatePublicPackage(parsed)) {
                errors.push(`${context.workspaceName}: ${error}`);
            }

            for (const error of validateExports(parsed.publishConfig.exports)) {
                errors.push(`${context.workspaceName}: ${error}`);
            }
        }

        return Promise.resolve(errors);
    },
};
