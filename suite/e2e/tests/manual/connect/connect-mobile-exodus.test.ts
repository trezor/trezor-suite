import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Exodus mobile app', { tag: ['@group=manual'] }, () => {
    test(
        'Connect Trezor to Exodus and sign transactions',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can use Exodus mobile app with Trezor',
                prerequisites: ['Seeded Trezor device with funded wallet'],
                steps: [
                    'open Exodus mobile app',
                    'click Exodus logo in top left corner',
                    'open “Settings and More”',
                    'open Settings',
                    'click “Connect Trezor”',
                    'click Continue',
                    'allow permissions',
                    'on TS7, click “Pair new device”',
                    'finish THP pairing',
                    'enter passphrase',
                    'observe “Trezor Connected”, click Continue and exit Settings',
                    'validate that accounts with correct balance are loaded',
                    'send transaction',
                ],
                category: TestCategory.TrezorConnect,
                priority: TestPriority.Low,
                stream: TestStream.Connect,
            }),
        },
        async () => {},
    );
});
