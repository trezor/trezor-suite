import { TestStream } from '@trezor/e2e-utils';

import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

const STAKE_PATH = "m/1852'/1815'/0'/2/0";
const MESSAGE = 'Test';
const COSE_SIGNATURE =
    '84582aa201276761646472657373581de1122a946b9ad3d2ddf029d3a828f0468aece76895f15c9efbd69b4277a166686173686564f444546573745840963bdbe05f28f91bf33379e371c450509cd07efc0c830b89dfb9e63e71866fcbeaa95cae8d6dab34fb7e7eb37a319f6d399245c165397418e0e551c2af49e606';
const COSE_PUB_KEY =
    'a4010103272006215820bc65be1b0b9d7531778a1317c2aa6de936963c3f9ac7d5ee9e9eda25e0c97c5e';

test.describe('Sign and verify ADA', { tag: ['@T3W1', '@T3T1', '@nightlyOnly'] }, () => {
    test.use({ deviceSetup: { mnemonic: 'mnemonic_all' } });

    test.beforeEach(async ({ onboardingPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await settingsPage.changeNetworks({ enableNetworks: ['ada'] });
    });

    test(
        'Signs message and shows Cardano COSE public key',
        { annotation: createTestAnnotation({ stream: TestStream.Network }) },
        async ({ page, walletPage, devicePrompt, device }) => {
            await walletPage.openAccount({ symbol: 'ada' });
            await walletPage.walletExtraDropDown.click();
            await walletPage.signAndVerifyButton.click();
            await page.getByTestId('@sign-verify/message').fill(MESSAGE);
            await page.getByTestId('@sign-verify/sign-address/input').click();
            await page.getByTestId(`@sign-verify/sign-address/option/${STAKE_PATH}`).click();
            await page.getByTestId('@sign-verify/cardano-pubkey-format/true').click();
            await page.getByTestId('@sign-verify/submit').click();

            await test.step('Confirm message payload on device', async () => {
                await devicePrompt.confirmOnDevicePromptIsShown();
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm message' },
                        body: [['Message text (4 bytes)'], [MESSAGE]],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndConfirm();
            });

            await test.step('Confirm reward address warning on device', async () => {
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm message' },
                        body: [
                            device.wrapText('Address is a reward address.', { wrapByWords: true }),
                        ],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndConfirm();
            });

            await test.step('Confirm stake credential path on device', async () => {
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm message' },
                        body: [
                            ['Address stake credential is a path:'],
                            device.wrapText(STAKE_PATH),
                        ],
                        actions: { right_button: 'Confirm' },
                    },
                    T3T1: {
                        body: [
                            ['Address stake credential is', '\n', 'a path:'],
                            device.wrapText(STAKE_PATH),
                        ],
                    },
                });
                await devicePrompt.waitForPromptAndConfirm();
            });

            await test.step('Confirm signing path on device', async () => {
                await expect(device).toShowOnDisplay({
                    T3W1: {
                        header: { title: 'Confirm message' },
                        body: [['Sign message with path'], ["m/1852'/1815'/0'/2", '\n', '/0']],
                        actions: { right_button: 'Confirm' },
                    },
                });
                await devicePrompt.waitForPromptAndConfirm();
            });

            await test.step('Verify COSE signature and public key in Suite', async () => {
                await expect(page.getByTestId('@sign-verify/signature')).toHaveValue(
                    COSE_SIGNATURE,
                );
                await expect(page.getByTestId('@sign-verify/pubKey')).toHaveValue(COSE_PUB_KEY);
                await expect(page.getByTestId('@sign-verify/outcome/signed')).toBeVisible();
            });
        },
    );
});
