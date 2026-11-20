import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Firmware update',
        {
            testCase: 'Firmware update',
            prerequisites: ['including language change'],
            steps: ['No manual steps defined in source; firmware update flow is not automatable'],
            category: TestCategory.Firmware,
            priority: TestPriority.Critical,
            stream: TestStream.Firmware,
        },
        async () => {},
    );
});
