import type { FeedbackCategory } from '@suite-common/feedback';
import { TestCategory, TestPriority } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('Bug report forms', { tag: ['@T3W1', '@T3T1'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });
    test(
        'Send a bug report',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can send a bug report.',
                category: TestCategory.SuiteGuide,
                priority: TestPriority.Medium,
            }),
        },
        async ({ page, guidePanel }) => {
            const testData = {
                location: 'account' as FeedbackCategory,
                report: 'Henlo this is testy test writing hangry test user report',
            };

            await guidePanel.openPanel();
            await guidePanel.supportAndFeedbackButton.click();

            await guidePanel.sendBugReport(testData);

            await expect(page.getByTestId('@toast/user-feedback-send-success')).toBeVisible();
        },
    );
});
