import { TestCategory, TestPriority, TestStream } from '../../support/enums/testAnnotations';
import { expect, test } from '../../support/fixtures';
import { createTestAnnotation } from '../../support/reporters/annotations';

test.describe('ETH staking', { tag: ['@group=wallet'] }, () => {
    test.use({
        emulatorSetupConf: {
            mnemonic: 'access juice claim special truth ugly swarm rabbit hair man error bar',
        },
    });
    test.beforeEach(
        async ({ page, dashboardPage, onboardingPage, settingsPage, blockbookMock }) => {
            await onboardingPage.completeOnboarding();

            await settingsPage.navigateTo('coins');
            await blockbookMock.start('eth');

            await settingsPage.coins.disableNetwork('btc');
            await settingsPage.coins.enableNetwork('eth');
            await settingsPage.coins.openNetworkAdvanceSettings('eth');
            await settingsPage.coins.changeBackend('blockbook', blockbookMock.url);

            await dashboardPage.dashboardMenuButton.click();
            await page.discoveryShouldFinish();
        },
    );

    test(
        'checks that staking dashboard works',
        {
            annotation: createTestAnnotation({
                testCase: 'Verifies that a user can access the Ethereum staking account.',
                category: TestCategory.ETH,
                priority: TestPriority.Critical,
                stream: TestStream.Trends,
            }),
        },
        async ({ page, walletPage, tradingPage }) => {
            await walletPage.openAccount({ symbol: 'eth', type: 'normal', atIndex: 0 });
            await walletPage.openSendFormButton.click();
            await tradingPage.sendAmountInput.fill('1111.456789012345678901');
            await page.getByTestId('@account-menu/eth/normal/0/staking').click();

            await expect(page.getByTestId('@account/staking/pending')).toHaveText('3,000');
            await expect(page.getByTestId('@account/staking/staked')).toHaveText('3,000');
            await expect(page.getByTestId('@account/staking/rewards')).toHaveText('1,234');
            await expect(page.getByTestId('@account/staking/unstaking')).toHaveText('4,000');
        },
    );
});
