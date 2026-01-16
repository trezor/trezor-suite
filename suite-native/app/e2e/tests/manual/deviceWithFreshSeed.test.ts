import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device with fresh seed',
        {
            testCase: 'Device with fresh seed',
            prerequisites: ['Already on-boarded application', 'Device with fresh seed loaded'],
            steps: [
                'Connect device and verify detection and discovery start',
                'Wait for discovery to finish and verify no accounts are found',
                'Verify Your wallet is empty info is rendered',
            ],
            category: TestCategory.Dashboard,
            priority: TestPriority.High,
            stream: TestStream.Foundation,
        },
        async () => {},
    );
});
