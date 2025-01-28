import {
    cardanoAccountDetails,
    cardanoStaking,
} from '../../snapshots/web/wallet/cardano.test.ts/cardano-aria';
import { expect, test } from '../../support/fixtures';

const receiveAddress =
    'addr_test1qphsv6vspp4l3nvmqzw529teq2ha08s0fgjvzghzh628uccfey0wtrgp5rmxvld7khc745x9mk7gts5ctuzerlf4edrq5at0x5';

// todo: setup emu with 24 words mnemonic so that we can test different cardano derivation and its 'auto-discovery; feature
//mnemonic: 'clot trim improve bag pigeon party wave mechanic beyond clean cake maze protect left assist carry guitar bridge nest faith critic excuse tooth dutch',

test.describe('Cardano', { tag: ['@group=wallet', '@snapshot'] }, () => {
    test.beforeEach(async ({ onboardingPage, dashboardPage, settingsPage }) => {
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await settingsPage.navigateTo('coins');
    });

    test('Basic cardano walkthrough', async ({
        page,
        dashboardPage,
        devicePrompt,
        settingsPage,
        walletPage,
    }) => {
        await settingsPage.coins.enableNetwork('tada');
        await settingsPage.coins.openNetworkAdvanceSettings('tada');
        await expect(settingsPage.modal).toHaveScreenshot('cardano-advanced-settings.png', {
            mask: [settingsPage.coins.coinAddressInput],
        });
        await settingsPage.modalCloseButton.click();

        await test.step('Verify Cardano account details', async () => {
            await dashboardPage.navigateTo();
            await walletPage.accountButton({ symbol: 'tada' }).click();
            await walletPage.accountDetailsTabButton.click();
            await expect(walletPage.accountDetails).toMatchAriaSnapshot(cardanoAccountDetails);
        });

        await test.step('Verify public key', async () => {
            await walletPage.showPublicKeyButton.click();
            await devicePrompt.waitForPromptAndConfirm();
            await expect(walletPage.copyPublicKeyButton).toBeEnabled();
            await expect(settingsPage.modal).toHaveScreenshot('cardano-show-xpub.png');
            await settingsPage.modalCloseButton.click();
        });

        await test.step('Verify Cardano send form', async () => {
            await walletPage.sendButton.click();
            await expect(walletPage.sendForm).toHaveScreenshot('cardano-send.png');
            await page.getByTestId('@account-subpage/back').click();
        });

        await test.step('Verify Cardano receive form', async () => {
            await walletPage.receiveButton.click();
            await walletPage.revealAddressButton.click();
            await devicePrompt.waitForPromptAndConfirm();
            await expect(walletPage.copyAddressButton).toBeEnabled();
            await expect(devicePrompt.outputValue).toHaveText(receiveAddress);
            await expect(settingsPage.modal).toHaveScreenshot('cardano-receive.png');
            await settingsPage.modalCloseButton.click();
            await page.getByTestId('@account-subpage/back').click();
        });

        await test.step('Verify Cardano staking', async () => {
            await walletPage.stakingButton.click();
            await expect(walletPage.stakingCardano).toMatchAriaSnapshot(cardanoStaking);
        });
    });
});
