import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Import Bitcoin address',
        {
            testCase: 'Import Bitcoin address',
            prerequisites: ['Bitcoin receive address'],
            steps: [
                'Navigate to My Assets and press + to import account',
                'Select Bitcoin and choose Scan QR',
                'Try to import Bitcoin receive address and verify address is not imported and user is informed it is a receive address',
            ],
            category: TestCategory.Application,
            priority: TestPriority.High,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
