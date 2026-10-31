import { Model } from '@trezor/trezor-user-env-link';

import {
    excludedFromFullPrRun,
    notWebOnlyUnlessEdited,
    sharedWithOtherModelUnlessEdited,
} from './grepUtils';

type ProjectTag = Model | 'noDevice';
type Target = 'web' | 'desktop';
type TestCase = {
    file: string;
    tags: string[];
};

// Mirrors the grep-invert lists in playwright-web-pr.config.ts and playwright-desktop-pr.config.ts.
const getGrepInvert = (projectTag: ProjectTag, target: Target): RegExp[] => [
    ...excludedFromFullPrRun(),
    ...(target === 'web' ? [notWebOnlyUnlessEdited()] : []),
    ...(projectTag === Model.T3T1 ? [sharedWithOtherModelUnlessEdited()] : []),
];

// Playwright greps "<project> <file relative to the config dir> <titles> <tags>".
const isSelected = (projectTag: ProjectTag, target: Target, { file, tags }: TestCase): boolean => {
    const title = `${projectTag} ../tests/${file} Feature does something ${tags.join(' ')}`;
    const isInProject = new RegExp(`^(?=.*@${projectTag})`).test(title);
    const isExcluded = getGrepInvert(projectTag, target).some(pattern => pattern.test(title));

    return isInProject && !isExcluded;
};

const sharedTest: TestCase = { file: 'wallet/send.test.ts', tags: ['@T3W1', '@T3T1', '@T3B1'] };
const sharedWebOnlyTest: TestCase = {
    file: 'browser/popup.test.ts',
    tags: ['@T3W1', '@T3T1', '@webOnly'],
};
const t3t1OnlyTest: TestCase = { file: 'wallet/haptic.test.ts', tags: ['@T3T1'] };
const t3t1OnlyWebOnlyTest: TestCase = {
    file: 'wallet/haptic-web.test.ts',
    tags: ['@T3T1', '@webOnly'],
};
const optionalTest: TestCase = { file: 'wallet/slow.test.ts', tags: ['@T3W1', '@optional'] };
const skipOnPrTest: TestCase = { file: 'wallet/nonce.test.ts', tags: ['@T3W1', '@skipOnPR'] };
const noDeviceTest: TestCase = { file: 'general/landing.test.ts', tags: ['@noDevice'] };

describe('full PR run test selection', () => {
    afterEach(() => {
        delete process.env.E2E_EDITED_SPECS;
    });

    describe('without edited test files', () => {
        it('runs a test without a platform tag on desktop only', () => {
            expect(isSelected(Model.T3W1, 'desktop', sharedTest)).toBe(true);
            expect(isSelected(Model.T3W1, 'web', sharedTest)).toBe(false);
            expect(isSelected('noDevice', 'desktop', noDeviceTest)).toBe(true);
            expect(isSelected('noDevice', 'web', noDeviceTest)).toBe(false);
        });

        it('runs a @webOnly test on web', () => {
            expect(isSelected(Model.T3W1, 'web', sharedWebOnlyTest)).toBe(true);
        });

        it('runs a test shared with another model on T3W1 but not on T3T1', () => {
            expect(isSelected(Model.T3W1, 'desktop', sharedTest)).toBe(true);
            expect(isSelected(Model.T3T1, 'desktop', sharedTest)).toBe(false);
            expect(isSelected(Model.T3T1, 'web', sharedWebOnlyTest)).toBe(false);
        });

        it('runs a T3T1-only test on T3T1', () => {
            expect(isSelected(Model.T3T1, 'desktop', t3t1OnlyTest)).toBe(true);
            expect(isSelected(Model.T3T1, 'web', t3t1OnlyWebOnlyTest)).toBe(true);
        });

        it('never runs a test tagged for another model', () => {
            expect(isSelected(Model.T3B1, 'desktop', t3t1OnlyTest)).toBe(false);
            expect(isSelected(Model.T3W1, 'desktop', noDeviceTest)).toBe(false);
        });

        it('skips @optional and @skipOnPR tests', () => {
            expect(isSelected(Model.T3W1, 'desktop', optionalTest)).toBe(false);
            expect(isSelected(Model.T3W1, 'desktop', skipOnPrTest)).toBe(false);
        });
    });

    describe('with edited test files', () => {
        beforeEach(() => {
            process.env.E2E_EDITED_SPECS = [
                'suite/e2e/tests/wallet/send.test.ts',
                'suite/e2e/tests/wallet/slow.test.ts',
                'suite/e2e/tests/wallet/nonce.test.ts',
                'suite/e2e/tests/general/landing.test.ts',
            ].join(',');
        });

        it('runs an edited test on web without @webOnly', () => {
            expect(isSelected(Model.T3W1, 'web', sharedTest)).toBe(true);
            expect(isSelected(Model.T3B1, 'web', sharedTest)).toBe(true);
            expect(isSelected('noDevice', 'web', noDeviceTest)).toBe(true);
        });

        it('runs an edited shared test on T3T1 on both targets', () => {
            expect(isSelected(Model.T3T1, 'desktop', sharedTest)).toBe(true);
            expect(isSelected(Model.T3T1, 'web', sharedTest)).toBe(true);
        });

        it('keeps the limits for tests the PR did not edit', () => {
            const notEditedSharedTest: TestCase = { ...sharedTest, file: 'wallet/receive.test.ts' };
            const notEditedOptionalTest: TestCase = {
                ...optionalTest,
                file: 'wallet/other.test.ts',
            };

            expect(isSelected(Model.T3W1, 'web', notEditedSharedTest)).toBe(false);
            expect(isSelected(Model.T3T1, 'desktop', notEditedSharedTest)).toBe(false);
            expect(isSelected(Model.T3W1, 'desktop', notEditedOptionalTest)).toBe(false);
        });

        it('runs an edited @optional test but never an edited @skipOnPR test', () => {
            expect(isSelected(Model.T3W1, 'desktop', optionalTest)).toBe(true);
            expect(isSelected(Model.T3W1, 'web', optionalTest)).toBe(true);
            expect(isSelected(Model.T3W1, 'desktop', skipOnPrTest)).toBe(false);
        });

        it('never runs an edited test on a model it is not tagged for', () => {
            expect(isSelected(Model.T1B1, 'desktop', sharedTest)).toBe(false);
        });
    });

    it('ignores empty entries in the edited files list', () => {
        process.env.E2E_EDITED_SPECS =
            'suite/e2e/tests/wallet/send.test.ts,,suite/e2e/tests/wallet/slow.test.ts,';

        expect(isSelected(Model.T3W1, 'web', sharedTest)).toBe(true);
        expect(
            isSelected(Model.T3W1, 'web', { ...sharedTest, file: 'wallet/receive.test.ts' }),
        ).toBe(false);
        expect(
            isSelected(Model.T3W1, 'desktop', { ...optionalTest, file: 'wallet/other.test.ts' }),
        ).toBe(false);
    });

    it('treats regex characters in an edited path literally', () => {
        process.env.E2E_EDITED_SPECS = 'suite/e2e/tests/wallet/btc+ltc (legacy).test.ts';

        expect(
            isSelected(Model.T3W1, 'web', {
                file: 'wallet/btc+ltc (legacy).test.ts',
                tags: ['@T3W1'],
            }),
        ).toBe(true);
        expect(
            isSelected(Model.T3W1, 'web', { file: 'wallet/btcXltc.test.ts', tags: ['@T3W1'] }),
        ).toBe(false);
    });
});
