import { readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

import { type Result, err, ok } from '@trezor/type-utils';

import type { Requirement, WorkspaceContext } from '../Requirement';

const TSCONFIG_FILE = 'tsconfig.json';
const REQUIRED_TS_BUILD_INFO_FILE = './dist/.tsbuildinfo';

type TsConfig = {
    readonly extends?: unknown;
    readonly compilerOptions?: Record<string, unknown>;
};

type ReadTsconfigResult = Result<TsConfig, ReadonlyArray<string>>;

const getTsconfigPath = (context: WorkspaceContext) => join(context.workspaceDir, TSCONFIG_FILE);

const toPosixPath = (path: string) => path.split(sep).join('/');

const getExpectedExtends = (context: WorkspaceContext) => {
    const relativePath = toPosixPath(
        relative(context.workspaceDir, resolve(context.repoRoot, 'tsconfig.base.json')),
    );

    return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
};

const readTsconfig = (context: WorkspaceContext): ReadTsconfigResult => {
    try {
        const parsed = JSON.parse(readFileSync(getTsconfigPath(context), 'utf-8')) as TsConfig;

        return ok(parsed);
    } catch {
        return err([
            `${context.workspaceName}: ${TSCONFIG_FILE} is missing or contains invalid JSON.`,
        ]);
    }
};

const getTsconfigErrors = (context: WorkspaceContext, parsed: TsConfig): ReadonlyArray<string> => {
    const expectedExtends = getExpectedExtends(context);
    const errors: string[] = [];

    if (parsed.extends !== expectedExtends) {
        errors.push(
            `${context.workspaceName}: extends must be "${expectedExtends}" in ${TSCONFIG_FILE}.`,
        );
    }

    if (parsed.compilerOptions?.tsBuildInfoFile !== REQUIRED_TS_BUILD_INFO_FILE) {
        errors.push(
            `${context.workspaceName}: compilerOptions.tsBuildInfoFile must be "${REQUIRED_TS_BUILD_INFO_FILE}" in ${TSCONFIG_FILE}.`,
        );
    }

    return errors;
};

export const requireTsconfig: Requirement<'workspace'> = {
    name: 'tsconfig',
    scope: 'workspace',
    verify: context => {
        const result = readTsconfig(context);

        if (!result.success) {
            return Promise.resolve(result.error);
        }

        return Promise.resolve(getTsconfigErrors(context, result.payload));
    },
};
