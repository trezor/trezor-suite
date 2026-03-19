import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Requirement } from '../Requirement';

const TSCONFIG_FILE = 'tsconfig.json';
const TYPECHECK_TSCONFIG_FILE = 'tsconfig.typecheck.json';
const IGNORED_PACKAGES = [
    'connect-example-electron-main',
    'connect-mobile-example',
    'connect-example-node',
    '@trezor/webextension-mv3-sw-ts',
];

type TsConfig = {
    readonly compilerOptions?: {
        readonly disableSourceOfProjectReferenceRedirect?: boolean;
    };
};

const readJsonFile = <T>(filePath: string): T | undefined => {
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
    } catch {
        return undefined;
    }
};

export const requireTypecheckConfig: Requirement<'workspace'> = {
    name: 'typecheck-config',
    scope: 'workspace',
    applies: context => !IGNORED_PACKAGES.includes(context.workspaceName),
    verify: context => {
        const tsconfigPath = join(context.workspaceDir, TSCONFIG_FILE);
        const typecheckConfigPath = join(context.workspaceDir, TYPECHECK_TSCONFIG_FILE);

        const tsconfig = readJsonFile<TsConfig>(tsconfigPath);
        const typecheckConfig = readJsonFile<TsConfig>(typecheckConfigPath);

        const errors: string[] = [];

        if (tsconfig === undefined) {
            errors.push(
                `${context.workspaceName}: ${TSCONFIG_FILE} is missing or contains invalid JSON.`,
            );
        }

        if (typecheckConfig === undefined) {
            errors.push(
                `${context.workspaceName}: ${TYPECHECK_TSCONFIG_FILE} is missing or contains invalid JSON.`,
            );
        } else if (
            typecheckConfig.compilerOptions?.disableSourceOfProjectReferenceRedirect !== true
        ) {
            errors.push(
                `${context.workspaceName}: ${TYPECHECK_TSCONFIG_FILE} must set compilerOptions.disableSourceOfProjectReferenceRedirect to true.`,
            );
        }

        return Promise.resolve(errors);
    },
};
