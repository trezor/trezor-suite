import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { RepoContext } from '../../Requirement';
import { requireAgentsSkills } from '../requireAgentsSkills';

const createTempRepo = (): string => mkdtempSync(join(tmpdir(), 'agents-skills-'));

describe(requireAgentsSkills.name, () => {
    let repoRoot: string;
    let context: RepoContext;

    beforeEach(() => {
        repoRoot = createTempRepo();
        context = { repoRoot };
        mkdirSync(join(repoRoot, 'skills'));
    });

    afterEach(() => {
        rmSync(repoRoot, { recursive: true, force: true });
    });

    it('passes when all skill files are linked', async () => {
        writeFileSync(join(repoRoot, 'skills', 'testing.md'), '# Testing');
        writeFileSync(join(repoRoot, 'skills', 'setup.md'), '# Setup');
        writeFileSync(
            join(repoRoot, 'AGENTS.md'),
            ['## Skills', '- [Testing](skills/testing.md)', '- [Setup](skills/setup.md)'].join(
                '\n',
            ),
        );

        const errors = await requireAgentsSkills.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports unlinked skill files', async () => {
        writeFileSync(join(repoRoot, 'skills', 'testing.md'), '# Testing');
        writeFileSync(join(repoRoot, 'skills', 'missing.md'), '# Missing');
        writeFileSync(join(repoRoot, 'AGENTS.md'), '- [Testing](skills/testing.md)');

        const errors = await requireAgentsSkills.verify(context);

        expect(errors).toEqual(['AGENTS.md does not link to skills/missing.md']);
    });

    it('reports multiple unlinked files', async () => {
        writeFileSync(join(repoRoot, 'skills', 'a.md'), '');
        writeFileSync(join(repoRoot, 'skills', 'b.md'), '');
        writeFileSync(join(repoRoot, 'AGENTS.md'), '# Agents');

        const errors = await requireAgentsSkills.verify(context);

        expect(errors).toHaveLength(2);
        expect(errors).toContain('AGENTS.md does not link to skills/a.md');
        expect(errors).toContain('AGENTS.md does not link to skills/b.md');
    });

    it('ignores non-markdown files in skills directory', async () => {
        writeFileSync(join(repoRoot, 'skills', 'notes.txt'), '');
        writeFileSync(join(repoRoot, 'skills', 'script.sh'), '');
        writeFileSync(join(repoRoot, 'AGENTS.md'), '# Agents');

        const errors = await requireAgentsSkills.verify(context);

        expect(errors).toEqual([]);
    });

    it('does not count links inside HTML comments', async () => {
        writeFileSync(join(repoRoot, 'skills', 'tests.md'), '# Tests');
        writeFileSync(
            join(repoRoot, 'AGENTS.md'),
            '<!-- - [Tests](skills/tests.md) – Test style guidelines and best practices -->',
        );

        const errors = await requireAgentsSkills.verify(context);

        expect(errors).toEqual(['AGENTS.md does not link to skills/tests.md']);
    });

    it('does not count links inside unterminated HTML comments', async () => {
        writeFileSync(join(repoRoot, 'skills', 'tests.md'), '# Tests');
        writeFileSync(
            join(repoRoot, 'AGENTS.md'),
            ['<!-- - [Tests](skills/tests.md)', 'This line remains inside the open comment'].join(
                '\n',
            ),
        );

        const errors = await requireAgentsSkills.verify(context);

        expect(errors).toEqual(['AGENTS.md does not link to skills/tests.md']);
    });

    it('ignores configured skill links', async () => {
        writeFileSync(
            join(repoRoot, 'skills', 'skills-and-code-style-contribution.md'),
            '# Skills',
        );
        writeFileSync(join(repoRoot, 'AGENTS.md'), '# Agents');

        const errors = await requireAgentsSkills.verify(context);

        expect(errors).toEqual([]);
    });

    it('has repo scope', () => {
        expect(requireAgentsSkills.scope).toBe('repo');
    });
});
