import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { RepoContext } from '../../Requirement';
import { requireDocsSummary } from '../requireDocsSummary';

const createTempRepo = (): string => mkdtempSync(join(tmpdir(), 'docs-summary-'));

describe(requireDocsSummary.name, () => {
    let repoRoot: string;
    let context: RepoContext;

    beforeEach(() => {
        repoRoot = createTempRepo();
        context = { repoRoot };
        mkdirSync(join(repoRoot, 'docs', 'symlink'), { recursive: true });
    });

    afterEach(() => {
        rmSync(repoRoot, { recursive: true, force: true });
    });

    it('passes when all docs files are linked', async () => {
        mkdirSync(join(repoRoot, 'docs', 'guides'), { recursive: true });
        writeFileSync(join(repoRoot, 'docs', 'index.md'), '# Docs');
        writeFileSync(join(repoRoot, 'docs', 'guides', 'setup.md'), '# Setup');
        writeFileSync(
            join(repoRoot, 'docs', 'SUMMARY.md'),
            ['# Summary', '[Intro](./index.md)', '- [Setup](./guides/setup.md)'].join('\n'),
        );

        const errors = await requireDocsSummary.verify(context);

        expect(errors).toEqual([]);
    });

    it('checks symlinked markdown files in docs', async () => {
        mkdirSync(join(repoRoot, 'external'), { recursive: true });
        mkdirSync(join(repoRoot, 'docs', 'symlink'), { recursive: true });
        writeFileSync(join(repoRoot, 'external', 'shared.md'), '# Shared');
        symlinkSync(
            join(repoRoot, 'external', 'shared.md'),
            join(repoRoot, 'docs', 'symlink', 'shared.md'),
        );
        writeFileSync(
            join(repoRoot, 'docs', 'SUMMARY.md'),
            ['# Summary', '- [Shared](./symlink/shared.md)'].join('\n'),
        );

        const errors = await requireDocsSummary.verify(context);

        expect(errors).toEqual([]);
    });

    it('reports multiple unlinked docs files', async () => {
        mkdirSync(join(repoRoot, 'docs', 'nested'), { recursive: true });
        writeFileSync(join(repoRoot, 'docs', 'a.md'), '');
        writeFileSync(join(repoRoot, 'docs', 'nested', 'b.md'), '');
        writeFileSync(join(repoRoot, 'docs', 'SUMMARY.md'), '# Summary');

        const errors = await requireDocsSummary.verify(context);

        expect(errors).toHaveLength(2);
        expect(errors).toContain('docs/SUMMARY.md does not link to ./a.md');
        expect(errors).toContain('docs/SUMMARY.md does not link to ./nested/b.md');
    });

    it('ignores non-markdown files in docs directory', async () => {
        writeFileSync(join(repoRoot, 'docs', 'notes.txt'), '');
        writeFileSync(join(repoRoot, 'docs', 'script.sh'), '');
        writeFileSync(join(repoRoot, 'docs', 'SUMMARY.md'), '# Summary');

        const errors = await requireDocsSummary.verify(context);

        expect(errors).toEqual([]);
    });

    it('does not count links inside HTML comments', async () => {
        writeFileSync(join(repoRoot, 'docs', 'index.md'), '# Docs');
        writeFileSync(
            join(repoRoot, 'docs', 'SUMMARY.md'),
            '<!-- - [Intro](./index.md) – hidden from the book -->',
        );

        const errors = await requireDocsSummary.verify(context);

        expect(errors).toEqual(['docs/SUMMARY.md does not link to ./index.md']);
    });

    it('does not count links inside unterminated HTML comments', async () => {
        writeFileSync(join(repoRoot, 'docs', 'index.md'), '# Docs');
        writeFileSync(
            join(repoRoot, 'docs', 'SUMMARY.md'),
            ['<!-- - [Intro](./index.md)', 'This line remains inside the open comment'].join('\n'),
        );

        const errors = await requireDocsSummary.verify(context);

        expect(errors).toEqual(['docs/SUMMARY.md does not link to ./index.md']);
    });

    it('ignores configured docs links', async () => {
        writeFileSync(join(repoRoot, 'docs', 'symlink', '_README.md'), '# Symlinks');
        writeFileSync(join(repoRoot, 'docs', 'SUMMARY.md'), '# Summary');

        const errors = await requireDocsSummary.verify(context);

        expect(errors).toEqual([]);
    });

    it('has repo scope', () => {
        expect(requireDocsSummary.scope).toBe('repo');
    });
});
