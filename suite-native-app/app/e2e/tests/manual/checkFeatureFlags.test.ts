import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Check if all feature flags are correctly set up and working',
        {
            testCase: 'Check if all feature flags are correctly set up and working',
            prerequisites: [],
            steps: [
                'Enable Dev utils by tapping multiple times on FW revision',
                'Go to Settings / Dev utils',
                'Verify all feature flags are correctly disabled and that they work as intended when toggled',
            ],
            category: TestCategory.Settings,
            priority: TestPriority.Critical,
            stream: TestStream.Growth,
        },
        async () => {},
    );
});
