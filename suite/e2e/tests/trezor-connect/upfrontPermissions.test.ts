import TrezorConnect from '@trezor/connect-web';
import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

// Separate from permissions.test.ts because the declaration is part of `TrezorConnect.init`, and
// every connect-ws spec in this folder initializes exactly once per file.
const DECLARED_PERMISSIONS = [
    { permission: 'read_address', coin: 'btc' },
    { permission: 'read_address', coin: 'ltc' },
] as const;

test.describe(
    'TrezorConnect upfront permissions',
    { tag: ['@T3T1', '@T3W1', '@desktopOnly'] },
    () => {
        test.use({ electronConf: { exposeConnectWs: true } });

        test.beforeEach(async ({ onboardingPage }) => {
            await onboardingPage.completeOnboarding();

            await test.step('Initialize TrezorConnect with declared permissions', async () => {
                await TrezorConnect.init({
                    manifest: {
                        appUrl: 'http://localhost:8080',
                        email: '',
                        appName: 'Tester',
                    },
                    coreMode: 'suite-desktop',
                    debug: true,
                    requestedPermissions: [...DECLARED_PERMISSIONS],
                });
            });
        });

        test(
            'Permissions - a declared set is approved in a single consent',
            {
                annotation: createTestAnnotation({
                    testCase:
                        'Suite Connect: permissions declared at init are shown in the first consent and cover later calls.',
                    stream: TestStream.Connect,
                }),
            },
            async ({ connectPermissionsModal, page }) => {
                await test.step('the consent lists the declared coins, not just the one being called', async () => {
                    TrezorConnect.getAddress({
                        path: "m/44'/0'/0'/0/0",
                        coin: 'btc',
                    });

                    await expect(
                        connectPermissionsModal.groupPermission('btc', 'read_address'),
                    ).toBeVisible();
                    // The call only needs btc, so the ltc group can only come from the declaration.
                    await expect(
                        connectPermissionsModal.groupPermission('ltc', 'read_address'),
                    ).toBeVisible();
                });

                await test.step('approving once remembers the whole declared set', async () => {
                    await connectPermissionsModal.rememberCheckbox.click();
                    await connectPermissionsModal.confirmButton.click();
                    await page.getByTestId('@connect-address-confirmation/confirm-button').click();
                    await page.getByTestId('@connect-address-confirmation/close-button').click();
                });

                await test.step('a declared coin the user never called is already granted', async () => {
                    TrezorConnect.getAddress({
                        path: "m/44'/2'/0'/0/0",
                        coin: 'ltc',
                    });

                    // Reaching the address confirmation at all means no consent was requested.
                    await expect(
                        page.getByTestId('@connect-address-confirmation/confirm-button'),
                    ).toBeVisible();
                    await expect(connectPermissionsModal.confirmButton).toBeHidden();
                });
            },
        );
    },
);
