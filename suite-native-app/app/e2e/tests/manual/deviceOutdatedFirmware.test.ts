import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { it } from '../../support/wrappedIt';

describe.skip('Manual', () => {
    it(
        'Device with outdated firmware',
        {
            testCase: 'Device with outdated firmware',
            prerequisites: [
                'Already on-boarded application',
                'Device with firmware older than latest production',
            ],
            steps: [
                'Connect device and verify it is detected',
                'Verify message with outdated firmware info is rendered',
            ],
            category: TestCategory.Device,
            priority: TestPriority.High,
            stream: TestStream.Firmware,
        },
        async () => {},
    );
});
