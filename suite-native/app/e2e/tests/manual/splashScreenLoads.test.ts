import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Splash screen loads',
        {
            testCase: 'Splash screen loads',
            prerequisites: [],
            steps: [
                'Start the app and verify splash screen appears and transfers promptly to next screen',
            ],
            category: TestCategory.NotCategorized,
            priority: TestPriority.Medium,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
