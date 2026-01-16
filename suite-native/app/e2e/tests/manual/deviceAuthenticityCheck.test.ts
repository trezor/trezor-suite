import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device authenticity check',
        {
            testCase: 'Device authenticity check',
            prerequisites: [],
            steps: ['Automatic device authenticity check (no manual steps defined)'],
            category: TestCategory.Settings,
            priority: TestPriority.Critical,
            stream: TestStream.Foundation,
        },
        async () => {},
    );
});
