import { capitalizeFirstLetter } from '@trezor/utils';

import {
    getCompanyNameFromList,
    invityEndpoint,
    invityRequest,
    sellQuotesBTC,
    sellTradeBTC,
} from '../../fixtures/invity';
import { expect, test } from '../../support/fixtures';

const mnemonic =
    'academic again academic academic academic academic academic academic academic academic academic academic academic academic academic academic academic pecan provide remember';

const fiatAmount = sellQuotesBTC[0].fiatStringAmount;
const cryptoAmount = sellQuotesBTC[0].cryptoStringAmount;
const provider = getCompanyNameFromList(sellQuotesBTC[0].exchange, 'sellList');

test.describe('Trading - Sell', { tag: ['@group=other', '@snapshot', '@webOnly'] }, () => {
    test.use({
        emulatorSetupConf: { mnemonic, passphrase_protection: true },
    });
    test.beforeEach(async ({ marketPage, onboardingPage, dashboardPage, walletPage }) => {
        // if (!process.env.PASSPHRASE) {
        //     throw new Error('PASSPHRASE not provided in env variables. Skipping the test');
        // }
        await marketPage.mockInvity();
        await marketPage.mockInvityTrade(sellTradeBTC, invityEndpoint.sellTrade);
        await onboardingPage.completeOnboarding();
        await dashboardPage.discoveryShouldFinish();
        await dashboardPage.deviceSwitchingOpenButton.click();
        // WIll be provided once the test is ready
        // await dashboardPage.addHiddenWallet(process.env.PASSPHRASE!);
        await dashboardPage.discoveryShouldFinish();
        await walletPage.openTrading();
        await marketPage.sellTabButton.click();
    });

    test('Sell Bitcoin for best offer', async ({ page, marketPage }) => {
        await test.step('Fill in a sell request', async () => {
            await marketPage.selectCountryOfResidence('CZ');
            const quoteRequestPromise = page.waitForRequest(invityEndpoint.sellQuotes);
            await marketPage.youPayCryptoInput.fill(cryptoAmount);
            await expect(quoteRequestPromise).toHavePayload(invityRequest.sellQuotesPayload);
            await marketPage.waitForSellOffersSync();
            await expect(marketPage.bestOfferAmount).toHaveText(fiatAmount);
            await expect(marketPage.quoteProvider).toHaveText(capitalizeFirstLetter(provider));
        });

        await test.step('Confirm sell', async () => {
            await marketPage.sellButton.click();
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.sellTrade);
            await marketPage.sellTermsConfirmButton.click();
            await expect(tradeRequestPromise).toHavePayload(invityRequest.sellTradePayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId', 'trade.refundAddress'],
            });
        });

        // TODO: Add missing steps, fix the redirection to the transaction detail
    });
});
