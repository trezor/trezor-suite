import { TestCategory, TestPriority, TestStream } from '@trezor/e2e-utils';

import { test } from '../../../support/fixtures';
import { createTestAnnotation } from '../../../support/reporters/annotations';

test.describe.skip('Safety checks', { tag: ['@group=manual'] }, () => {
    test(
        'Switch safety checks between Strict and Prompt',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that the safety checks level can be switched between Strict and Prompt, that Prompt is presented as risky, and that the level survives a reconnect.',
                prerequisites: ['Seeded Trezor device', 'Connected Trezor Suite'],
                steps: [
                    'Navigate to "Settings/Device"',
                    'In the "Safety checks" section click "Change"',
                    'Confirm the modal offers "Strict" and "Prompt" with their descriptions',
                    'Confirm "Prompt" carries a "Change at your own risk!" warning',
                    'Confirm "Strict" is the currently selected level',
                    'Select "Prompt" and confirm the change on the device',
                    'Confirm a banner warns that safety checks are disabled, with a shortcut back to the settings',
                    'Reconnect the device and confirm the level is still "Prompt" and the banner is still shown',
                    'Switch back to "Strict" and confirm the change on the device',
                    'Confirm the warning banner disappears',
                ],
                category: TestCategory.Security,
                priority: TestPriority.High,
                stream: TestStream.Firmware,
            }),
        },
        async () => {},
    );

    test(
        'Safety checks gate non-standard actions',
        {
            annotation: createTestAnnotation({
                testCase:
                    'Verifies that a non-standard action is refused under Strict safety checks and can be manually approved on the device under Prompt.',
                prerequisites: [
                    'Seeded Trezor device',
                    'Connected Trezor Suite',
                    'Debug mode enabled so a non-standard derivation path account can be added',
                ],
                steps: [
                    'Set safety checks to "Strict"',
                    'Attempt an action the device considers non-standard - eg. adding an account on a non-standard derivation path, or sending with an unreasonably high fee',
                    'Confirm the device refuses the action and Suite surfaces the failure',
                    'Set safety checks to "Prompt"',
                    'Attempt the same action again',
                    'Confirm the device now asks for manual approval instead of refusing',
                    'Approve the action on the device and confirm it completes',
                    'Set safety checks back to "Strict" and confirm the action is refused again',
                ],
                category: TestCategory.Security,
                priority: TestPriority.Medium,
                stream: TestStream.Firmware,
            }),
        },
        async () => {},
    );
});
