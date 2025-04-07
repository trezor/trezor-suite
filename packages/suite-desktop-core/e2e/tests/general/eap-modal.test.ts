import { TestAnnotationType, TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';

test.use({ startEmulator: false });

test(
    'Join early access',
    { 
        tag: ['@group=settings', '@desktopOnly'],
        annotation: [
            {
                type: TestAnnotationType.TestCase,
                description: 'Verify that a user can join the early access program.',
            },
            {
                type: TestAnnotationType.Category,
                description: TestCategory.Settings,
            },
            {
                type: TestAnnotationType.Priority,
                description: TestPriority.Critical,
            },
            {
                type: TestAnnotationType.Stream,
                description: 'TODO',
            },
        ]
    },
    async ({ settingsPage }) => {
        await settingsPage.navigateTo('application');
        await settingsPage.joinEarlyAccessProgram();
        await expect(settingsPage.earlyAccessJoinButton).toHaveText('Opt out');
    },
);
