import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device in bootloader mode',
        {
            testCase: 'Device in bootloader mode',
            prerequisites: ['Already on-boarded application', 'Device in bootloader mode'],
            steps: [
                'Connect device in bootloader mode',
                'Verify application detects device and asks to eject and reconnect it not in bootloader mode',
            ],
            category: TestCategory.Device,
            priority: TestPriority.High,
            stream: TestStream.Foundation,
        },
        async () => {},
    );
});
