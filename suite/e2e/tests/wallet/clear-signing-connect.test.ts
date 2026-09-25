import { TestStream } from '@trezor/e2e-utils';

import { clearSigningScenarios } from '../../fixtures/clearSigning';
import { expect } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';
import { test } from '../../support/testExtends/clearSigningFixture';

test.describe(
    'Clear signing through Connect in Suite web',
    { tag: ['@T3W1', '@T3T1', '@webOnly', '@nightlyOnly'] },
    () => {
        for (const scenario of clearSigningScenarios) {
            test(
                `User can review and sign ${scenario.name} invoked through Connect`,
                { annotation: createTestAnnotation({ stream: TestStream.Connect }) },
                async ({ page, confirmClearSigning }) => {
                    const signing = page.evaluate(
                        params => window.TrezorConnect!.ethereumSignTransaction(params),
                        { path: "m/44'/60'/0'/0/0", transaction: scenario.transaction },
                    );

                    const [result] = await Promise.all([
                        signing,
                        test.step('Review clear-signed details on Trezor', () =>
                            confirmClearSigning(scenario)),
                    ]);
                    expect(result).toMatchObject({
                        success: true,
                        payload: { serializedTx: expect.stringMatching(/^(0x)?[0-9a-f]+$/i) },
                    });
                },
            );
        }
    },
);
