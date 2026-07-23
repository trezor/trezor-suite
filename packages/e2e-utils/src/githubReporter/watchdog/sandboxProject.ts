import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import path from 'path';

import { scheduleAction } from '@trezor/utils';

import { SANDBOX_PROJECT_NAME } from '../gitHubProject';
import { type ProjectRequests } from '../projectRequests';
import { type LoggingFunctions } from '../types';

// The project-scoped PAT lives in the e2e-utils env file.
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const ORGANIZATION = 'trezor';

// GitHub Projects has read-after-write lag; callers wrap the thin request methods in this retry (as the reporter does).
export const RETRY_CONF = {
    attempts: 5,
    gap: 500,
};

export const createLogger = (label: string): LoggingFunctions => ({
    log: (...args: any[]) => console.warn(`[${label}]`, ...args),
    logError: (...args: any[]) => console.error(`[${label} ERROR]`, ...args),
    logResponse: () => {},
});

export const createOctokit = (): Octokit => {
    if (!process.env.GITHUB_TOKEN) {
        throw new Error('GITHUB_TOKEN environment variable is required');
    }

    return new Octokit({ auth: process.env.GITHUB_TOKEN });
};

// Resolves the sandbox project strictly by name; wipe/verify can therefore never touch the real release board.
export const resolveSandboxProject = async (
    projects: ProjectRequests,
): Promise<{ id: string; title: string; number: number }> => {
    const found = await scheduleAction(
        () => projects.getProjectFromOrganization(ORGANIZATION, SANDBOX_PROJECT_NAME),
        RETRY_CONF,
    );
    const project = found.find(p => p.title === SANDBOX_PROJECT_NAME);
    if (!project) {
        throw new Error(
            `Sandbox project "${SANDBOX_PROJECT_NAME}" not found. Got: ${found
                .map(p => p.title)
                .join(' | ')}`,
        );
    }

    return project;
};
