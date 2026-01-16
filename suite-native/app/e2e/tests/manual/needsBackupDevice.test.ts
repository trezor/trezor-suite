import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Needs backup device',
        {
            testCase: 'Needs backup device',
            prerequisites: ['Device that went through onboarding with skipped backup'],
            steps: [
                'Connect device to mobile and verify You need wallet backup warning appears with Create wallet backup button',
                'Click Create wallet backup and verify backup from onboarding starts',
                'Backup failed variant: fail wallet creation and verify backup failed warning appears with Wipe device & create backup button and Your wallet backup failed screen is available',
            ],
            category: TestCategory.Security,
            priority: TestPriority.Medium,
            stream: TestStream.Foundation,
        },
        async () => {},
    );
});
