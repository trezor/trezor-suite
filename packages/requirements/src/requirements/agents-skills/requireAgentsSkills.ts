import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import type { Requirement } from '../Requirement';

const SKILLS_DIR = 'skills';
const AGENTS_FILE = 'AGENTS.md';
const IGNORED_SKILL_LINKS = new Set([
    'skills/skills-and-code-style-contribution.md', // not a skill
    'skills/dependency-injection.md', // only for some `packages`
    'skills/tests-native.md', // only for `native`
]);

const stripComments = (content: string) => {
    let sanitized = '';
    let cursor = 0;

    while (cursor < content.length) {
        const commentStartIndex = content.indexOf('<!--', cursor);

        if (commentStartIndex === -1) {
            sanitized += content.slice(cursor);

            break;
        }

        sanitized += content.slice(cursor, commentStartIndex);

        const commentEndIndex = content.indexOf('-->', commentStartIndex + 4);

        if (commentEndIndex === -1) {
            break;
        }

        cursor = commentEndIndex + 3;
    }

    return sanitized;
};

/**
 * Verifies that every markdown file in skills is linked from AGENTS.md
 */
export const requireAgentsSkills: Requirement<'repo'> = {
    name: 'agents-skills-linked',
    scope: 'repo',
    verify: ({ repoRoot }) => {
        const errors: string[] = [];
        const skillsPath = join(repoRoot, SKILLS_DIR);
        const agentsPath = join(repoRoot, AGENTS_FILE);

        const skillFiles = readdirSync(skillsPath).filter(f => f.endsWith('.md'));
        const agentsContent = stripComments(readFileSync(agentsPath, 'utf-8'));

        for (const file of skillFiles) {
            const link = `${SKILLS_DIR}/${file}`;

            if (IGNORED_SKILL_LINKS.has(link)) {
                continue;
            }

            if (!agentsContent.includes(link)) {
                errors.push(`${AGENTS_FILE} does not link to ${link}`);
            }
        }

        return Promise.resolve(errors);
    },
};
