import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import path from 'path';

import { GitHubProject } from './gitHubProject';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

class ScriptLogger {
    log(...args: any[]): void {
        console.warn('[GitHub Project Creator]', ...args);
    }

    logError(...args: any[]): void {
        console.error('[GitHub Project Creator ERROR]', ...args);
    }

    logResponse(label: string, response: any): void {
        console.warn(`[GitHub Project Creator] ${label}:`);
        console.warn(JSON.stringify(response, null, 2));
    }
}

async function main() {
    // Check for GitHub token with permissions `project, read:org`
    if (!process.env.GITHUB_TOKEN) {
        console.error('Error: GITHUB_TOKEN environment variable is required');
        process.exit(1);
    }

    const logger = new ScriptLogger();
    logger.log('Initializing...');

    try {
        const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
        const gitHubProject = new GitHubProject(octokit, logger);

        logger.log('Creating GitHub project...');
        await gitHubProject.createProject();
        logger.log('GitHub project created successfully!');
    } catch (error) {
        logger.logError('Failed to create GitHub project:', error);
        process.exit(1);
    }
}

main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
