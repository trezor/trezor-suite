import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device with no firmware T1B1',
        {
            testCase: 'T1B1 with no firmware',
            prerequisites: ['Wiped app', 'T1B1 with no firmware installed'],
            steps: [
                'Connect device',
                'Verify application detects device and asks to eject device and use desktop version',
            ],
            category: TestCategory.Device,
            priority: TestPriority.High,
            stream: TestStream.Firmware,
        },
        async () => {},
    );
});
