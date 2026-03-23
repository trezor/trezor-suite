/* eslint-disable no-console */
import { execSync, spawn } from 'child_process';
import * as path from 'path';

import type { ProjectConfig } from './types';

export const getJestTestFiles = (): string[] => {
    try {
        const output = execSync('npx jest --listTests --config ./e2e/jest.config.js', {
            cwd: process.cwd(),
            encoding: 'utf8',
            env: { ...process.env, CI: 'true', TDR_PROJECT_NAME: 'detox' },
        });

        return output
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && path.isAbsolute(line))
            .sort();
    } catch (e) {
        console.error('Failed to list test files via Jest:', e);
        process.exit(1);
    }
};

const runDetox = (
    detoxConfiguration: string,
    env: NodeJS.ProcessEnv,
    headless: boolean,
    testFiles?: string[],
): Promise<void> =>
    new Promise((resolve, reject) => {
        const args = ['detox', 'test', '--configuration', detoxConfiguration];
        if (headless) {
            args.push('--headless');
        }
        if (testFiles && testFiles.length > 0) {
            args.push(...testFiles);
        }

        const child = spawn('npx', args, { stdio: 'inherit', env });

        child.on('close', code => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(
                        `Detox tests for configuration ${detoxConfiguration} failed with exit code ${code}`,
                    ),
                );
            }
        });

        child.on('error', err => reject(err));
    });

const runProject = async (
    project: ProjectConfig,
    headless: boolean,
    testFiles: string[],
): Promise<void> => {
    console.log(`\nStarting project: ${project.projectName}`);

    const env: NodeJS.ProcessEnv = {
        ...process.env,
        TDR_PROJECT_NAME: project.projectName,
    };

    if (project.model) {
        env.TDR_MODEL = project.model;
    }
    if (project.firmwareVersion) {
        env.TDR_FIRMWARE_VERSION = project.firmwareVersion;
    }
    if (project.grep) {
        env.TDR_GREP = project.grep;
    }

    await runDetox(project.target, env, headless, testFiles);
};

/**
 * Run a single project and return whether Detox itself crashed (exit code != 0
 * or spawn error), independently of the JUnit report contents.
 */
export const runProjectSafely = async (
    project: ProjectConfig,
    headless: boolean,
    testFiles: string[],
): Promise<boolean> => {
    try {
        await runProject(project, headless, testFiles);

        return false;
    } catch (error) {
        console.error(`Project ${project.projectName} failed:`, error);

        return true;
    }
};
