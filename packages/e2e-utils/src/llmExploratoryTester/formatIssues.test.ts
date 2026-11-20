import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type Issue, IssueSchema } from './schemas';

const filter = readFileSync(join(__dirname, 'formatIssues.jq'), 'utf8');

const formatIssues = (issues: Issue[]) =>
    execFileSync(
        'jq',
        ['-nr', '--argjson', 'issues', JSON.stringify(issues), `{issues: $issues} | ${filter}`],
        {
            encoding: 'utf8',
        },
    );

const issue: Issue = {
    id: 'BUG-1',
    severity: 'high',
    relevance: 'pr-related',
    title: 'Custom fee ignored',
    description: 'The transaction uses the preset fee instead of the custom fee.',
    reproSteps: ['Enter a custom fee', 'Review the transaction'],
    screenshots: ['custom-fee.png'],
};

describe('finding relevance', () => {
    it('puts PR-related findings before unrelated and uncertain findings regardless of severity', () => {
        expect(
            formatIssues([
                {
                    ...issue,
                    id: 'BUG-2',
                    severity: 'critical',
                    relevance: 'unrelated',
                    title: 'Other flow fails',
                },
                issue,
                { ...issue, id: 'BUG-3', relevance: 'uncertain', title: 'Connection interrupted' },
            ]),
        ).toBe(
            '\n### PR-related\n\n- **BUG-1** [high] Custom fee ignored\n' +
                '\n### Other observations\n\n- **BUG-2** [critical] Other flow fails\n' +
                '- **BUG-3** [high] [relevance uncertain] Connection interrupted\n',
        );
    });

    it.each(['pr-related', 'unrelated', 'uncertain'] as const)(
        'omits the empty group for %s findings',
        relevance => {
            const output = formatIssues([{ ...issue, relevance }]);

            expect(output).toContain(
                relevance === 'pr-related' ? '### PR-related' : '### Other observations',
            );
            expect(output).not.toContain(
                relevance === 'pr-related' ? '### Other observations' : '### PR-related',
            );
        },
    );

    it('omits both groups when there are no findings', () => {
        expect(formatIssues([])).toBe('');
    });

    it('requires an explicit supported relevance classification', () => {
        expect(IssueSchema.safeParse({ ...issue, relevance: undefined }).success).toBe(false);
        expect(IssueSchema.safeParse({ ...issue, relevance: 'regression' }).success).toBe(false);
    });
});
