import { FeedbackCategory } from '@suite-common/suite-types';

import { TestAnnotationType, TestCategory, TestPriority } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';

test.describe('Bug report forms', { tag: ['@group=suite'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test('Send a bug report', {
            annotation: [
                {
                    type: TestAnnotationType.TestCase,
                    description: 'Verifies that a user can send a bug report.',
                },
                {
                    type: TestAnnotationType.Category,
                    description: TestCategory.SuiteGuide,
                },
                {
                    type: TestAnnotationType.Priority,
                    description: TestPriority.Medium,
                },
                {
                    type: TestAnnotationType.Stream,
                    description: 'TODO',
                },
            ]
        }, async ({ page, guidePanel }) => {
        const testData = {
            location: 'account' as FeedbackCategory,
            report: 'Henlo this is testy test writing hangry test user report',
        };

        await guidePanel.openPanel();
        await guidePanel.supportAndFeedbackButton.click();

        await guidePanel.sendBugReport(testData);

        await expect(page.getByTestId('@toast/user-feedback-send-success')).toBeVisible();
    });
});
