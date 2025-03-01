import { FeedbackCategory } from '@suite-common/suite-types';

import { expect, test } from '../../support/fixtures';

test.describe('Bug report forms', { tag: ['@group=suite'] }, () => {
    test.use({ emulatorSetupConf: { mnemonic: 'mnemonic_all' } });
    test('Send a bug report', async ({ page, guidePanel }) => {
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
