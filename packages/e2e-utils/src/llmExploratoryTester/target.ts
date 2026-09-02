import { execFileSync } from 'node:child_process';

const REPO = 'trezor/trezor-suite';

export type Target = { kind: 'pr'; number: number } | { kind: 'issue'; number: number };

export function parseTarget(input: string | undefined): Target {
    if (!input) {
        throw new Error('TARGET env var is required');
    }

    const url = new URL(input);
    const [, owner, repo, resource, lastSegment] = url.pathname.split('/');
    const targetNumber = Number(lastSegment);

    const isSuiteRepo = url.hostname === 'github.com' && `${owner}/${repo}`.toLowerCase() === REPO;
    const isSupportedResource = resource === 'pull' || resource === 'issues';
    const hasValidNumber = Number.isInteger(targetNumber) && targetNumber > 0;

    if (!isSuiteRepo || !isSupportedResource || !hasValidNumber) {
        throw new Error(`TARGET must be a trezor-suite PR or issue URL, got: ${input}`);
    }

    return { kind: resource === 'pull' ? 'pr' : 'issue', number: targetNumber };
}

export function ghView<T>(resource: 'issue' | 'pr', number: number, fields: string): T {
    return JSON.parse(
        execFileSync('gh', [resource, 'view', String(number), '--repo', REPO, '--json', fields], {
            encoding: 'utf-8',
            maxBuffer: 16 * 1024 * 1024,
        }),
    );
}

type LinkedReference = { number: number; repository: { name: string; owner: { login: string } } };

// Nothing outside this repo is testable here.
const isSuiteReference = ({ repository }: LinkedReference) =>
    `${repository.owner.login}/${repository.name}`.toLowerCase() === REPO;

export function loadLinkedNumbersFrom(kind: Target['kind'], number: number): number[] {
    const field = kind === 'pr' ? 'closingIssuesReferences' : 'closedByPullRequestsReferences';
    // gh answers with a single-key object: `{ [field]: [...] }`.
    const response = ghView<Record<string, LinkedReference[]>>(kind, number, field);
    const references = Object.values(response).flat();

    return references.filter(isSuiteReference).map(reference => reference.number);
}
