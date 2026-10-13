import { arrayPartition } from '@trezor/utils';

import { warn } from '../logger';
import type { SelectionResult } from './types';

const SUITE_E2E_DIR = 'suite/e2e/';
export const SUITE_E2E_TESTS_DIR = `${SUITE_E2E_DIR}tests/`;

type KeepRunnableTestsParams = {
    llmResult: Omit<SelectionResult, 'changed_files'>;
    suiteE2ETestFiles: Set<string>;
};

// The job strips a leading `suite/e2e/` before resolving a spec, so a path relative to suite/e2e/
// names a runnable file too. Accept both spellings and emit the repository-root-relative one, which
// is what the spec list and the `git ls-tree` listing use.
const normalizeRecommendedTest = (test: string): string => {
    const trimmed = test.trim().replace(/^\.\//, '');

    return trimmed.startsWith(SUITE_E2E_DIR) ? trimmed : `${SUITE_E2E_DIR}${trimmed}`;
};

// The model can return tests the Suite e2e job can't run, e.g. a connect-core e2e test the PR edits
// or an LLM analysis entry whose file was deleted since. The job fails when none of its specs exists
// at the PR head. An empty recommendation set makes the caller run everything, which `summary` has
// to say.
export const keepRunnableTests = ({
    llmResult,
    suiteE2ETestFiles,
}: KeepRunnableTestsParams): Omit<SelectionResult, 'changed_files'> => {
    const [runnableRecommendations, droppedRecommendations] = arrayPartition(
        llmResult.recommendations,
        ({ test }) => suiteE2ETestFiles.has(normalizeRecommendedTest(test)),
    );
    // The emitted spec list stays repository-root-relative even when the model wrote the other form.
    const runnableSpecs = runnableRecommendations.map(recommendation => ({
        ...recommendation,
        test: normalizeRecommendedTest(recommendation.test),
    }));

    if (droppedRecommendations.length === 0) {
        return { ...llmResult, recommendations: runnableSpecs };
    }

    const droppedTestList = droppedRecommendations.map(({ test }) => test).join(', ');
    const droppedNote = `Dropped recommended tests that don't exist under ${SUITE_E2E_TESTS_DIR}: ${droppedTestList}.`;
    const fallbackNote = runnableSpecs.length === 0 ? ' Falling back to the full e2e suite.' : '';
    warn(droppedNote);

    return {
        ...llmResult,
        recommendations: runnableSpecs,
        summary: `${llmResult.summary} ${droppedNote}${fallbackNote}`,
    };
};
