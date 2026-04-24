import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { Requirement } from '../Requirement';

const TYPECHECK_TSCONFIG_FILE = 'tsconfig.typecheck.json';
const REQUIRED_TYPECHECK_TSCONFIG_CONTENT = readFileSync(
    new URL('./tsconfig.typecheck.template.json', import.meta.url),
    'utf-8',
);

const isIgnoredWorkspace = (workspaceName: string) =>
    [
        'connect-example-electron-main',
        'connect-mobile-example',
        'connect-example-node',
        '@trezor/webextension-mv3-sw-ts',
    ].some(packageName => packageName === workspaceName);

const getVerificationErrors = ({
    workspaceDir,
    workspaceName,
}: {
    workspaceDir: string;
    workspaceName: string;
}) => {
    if (isIgnoredWorkspace(workspaceName)) {
        return [];
    }

    const typecheckTsconfigPath = join(workspaceDir, TYPECHECK_TSCONFIG_FILE);

    if (!existsSync(typecheckTsconfigPath)) {
        return [`${workspaceName}: ${TYPECHECK_TSCONFIG_FILE} must exist in the workspace root.`];
    }

    const actualContent = readFileSync(typecheckTsconfigPath, 'utf-8');

    if (actualContent !== REQUIRED_TYPECHECK_TSCONFIG_CONTENT) {
        return [`${workspaceName}: ${TYPECHECK_TSCONFIG_FILE} must match the required content.`];
    }

    return [];
};

export const requireTypecheckTsconfig: Requirement<'workspace'> = {
    name: 'typecheck-tsconfig',
    scope: 'workspace',
    verify: context =>
        Promise.resolve(
            getVerificationErrors({
                workspaceDir: context.workspaceDir,
                workspaceName: context.workspaceName,
            }),
        ),
    fix: context => {
        if (!isIgnoredWorkspace(context.workspaceName)) {
            writeFileSync(
                join(context.workspaceDir, TYPECHECK_TSCONFIG_FILE),
                REQUIRED_TYPECHECK_TSCONFIG_CONTENT,
                'utf-8',
            );
        }

        return Promise.resolve(
            getVerificationErrors({
                workspaceDir: context.workspaceDir,
                workspaceName: context.workspaceName,
            }),
        );
    },
};
