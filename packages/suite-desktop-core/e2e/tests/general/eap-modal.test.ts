import { TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.use({ startEmulator: false });

test(
    'Join early access',
    {
        tag: ['@group=settings', '@desktopOnly'],
        annotation: createTestAnnotation({
            testCase: 'Verify that a user can join the early access program.',
            category: TestCategory.Settings,
            priority: TestPriority.Critical,
        }),
    },
    async ({ settingsPage }) => {
        await settingsPage.navigateTo('application');
        await settingsPage.joinEarlyAccessProgram();
        await expect(settingsPage.earlyAccessJoinButton).toHaveText('Opt out');
    },
);
