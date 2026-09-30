import { resolveRunIdentity } from './publishRuns';

describe('resolveRunIdentity', () => {
    it('takes the branch under test from a pull request, not the merge ref', () => {
        expect(
            resolveRunIdentity({
                GITHUB_HEAD_REF: 'feat/thing',
                GITHUB_REF_NAME: '32587/merge',
                GITHUB_SHA: 'aaa',
                PERF_SHA: 'bbb',
                GITHUB_RUN_ID: '9',
                GITHUB_RUN_ATTEMPT: '2',
                PERF_PR_NUMBER: '32587',
            }),
        ).toEqual({
            branch: 'feat/thing',
            sha: 'bbb',
            runId: '9',
            runAttempt: '2',
            prNumber: '32587',
        });
    });

    it('falls back to the pushed branch and the run defaults', () => {
        expect(resolveRunIdentity({ GITHUB_REF_NAME: 'develop', GITHUB_SHA: 'aaa' })).toEqual({
            branch: 'develop',
            sha: 'aaa',
            runId: 'local',
            runAttempt: '1',
        });
    });

    it('publishes nothing outside CI, where there is no branch', () => {
        expect(resolveRunIdentity({})).toBeNull();
    });
});
