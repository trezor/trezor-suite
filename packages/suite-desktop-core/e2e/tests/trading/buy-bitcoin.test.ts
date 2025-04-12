import { localizeNumber } from '@suite-common/wallet-utils';
import { capitalizeFirstLetter } from '@trezor/utils';

import {
    buyQuotesBTC,
    buyQuotesBTCUpdate,
    buyTradeBTC,
    invityEndpoint,
    invityRequest,
} from '../../fixtures/invity';
import { formatAddress } from '../../support/common';
import { expect, test } from '../../support/fixtures';

const allAvailableAddressesBTC = [
    'bc1q7ceqvaq7fqyywxqcx7qnfxkfk2ykpsla9pe80q',
    'bc1q9lh9k4hgzjwas3kjx9sefvm4yn9vwwsd4hacdv',
    'bc1qa3hyq2jgzhrkpwtxxv952ztgw4wxr28hywwkg0',
    'bc1qdn5q78hpnze7xs9jcsgy25lemdlytenn25w6pq',
    'bc1qrvyuflny4sxdagera05a6tfr6njn0pfjuz5qnl',
    'bc1qm9pah7pwen43hwyk8kren9v2fez27glkdzxsqu',
    'bc1qr50uk25pt5z6shwjf2nz4s76xdhprr32lswqqv',
    'bc1qmt38u3kugzxd82rjkhquurxrasdx9k7xngnpa8',
    'bc1qz330fmkt8lgauer800tdnlukjhef7ym9f2yua3',
    'bc1qnpluf6s3rjrwacnp4r0zzq087mhwxdnnu6lx4z',
    'bc1qz2fgkzkfk6xk7j3t0wpx3vspjzvvhehhpddm6j',
    'bc1qf46r8hf3u2jx6qgy70aavd6rcx4a5md87lj22c',
    'bc1qdzsae7zgxta6244yvasxxepnksy0cmhy98445q',
    'bc1qy2qatc2m04ctqqvqa820kgcf556ynyh3v7x0mm',
    'bc1qzklur7l2djnttxscves2drw2qenfr9jnquqyft',
    'bc1qfage3v4dwzz5qs7h9luxh6zprcm3cd8pud4gjt',
    'bc1q7gmxgs4ph2pw39w0w2l5m4jz059gc88mhujfv9',
    'bc1qhwmlg7tjlmel647jjm2cjf2gh6fga3jnpxwwd8',
    'bc1q3y062n3fzjzekxlrc52fsrvh9uu7xca4cdk56y',
    'bc1qhl3g568gwgndwwepe7dycs37l3snm0uww4k4uv',
    'bc1qkkr2uvry034tsj4p52za2pg42ug4pxg5qfxyfa',
    'bc1qpszctuml70ulzf7f0zy5r4sg9nm65qfpgcw0uy',
];
// Expected values based on our mocked responses
const fiatAmount = buyQuotesBTC[0].fiatStringAmount;
const bestBuyProvider = capitalizeFirstLetter(buyQuotesBTC[0].exchange);
const bestBuyCryptoAmount = `${buyQuotesBTC[0].receiveStringAmount} BTC`;
const formattedFiatWithoutSymbol = localizeNumber(fiatAmount);
const formattedFiatAmount = `CZK ${localizeNumber(fiatAmount, 'en', 2)}`;
const { receiveAddress, paymentMethodName } = buyTradeBTC.trade;
// secondOffer via Bank Transfer that matches input criteria has index 5
const updateFiatAmount = buyQuotesBTCUpdate[5].fiatStringAmount;
const secondOfferProvider = capitalizeFirstLetter(buyQuotesBTCUpdate[5].exchange);
const secondOfferCryptoAmount = `${buyQuotesBTCUpdate[5].receiveStringAmount} BTC`;
const formattedUpdateFiatAmount = `CZK ${localizeNumber(updateFiatAmount, 'en', 2)}`;

test.describe('Trading - Buy BTC', { tag: ['@group=trading', '@webOnly'] }, () => {
    test.beforeEach(async ({ page, tradingMock, onboardingPage, walletPage }) => {
        await page.route(invityEndpoint.buyQuotes, async route => {
            await route.fulfill({ json: buyQuotesBTC });
        });
        await tradingMock.routeTrade(invityEndpoint.buyTrade, buyTradeBTC);
        await onboardingPage.completeOnboarding();
        await walletPage.openTrading();
    });

    test('Buy Bitcoin from compared offer', async ({ page, tradingPage }) => {
        await test.step('Fill input amount and opens offer comparison', async () => {
            await tradingPage.fillBuyForm(fiatAmount);
            await expect(tradingPage.bestOfferAmount).toHaveText(bestBuyCryptoAmount);
            await expect(tradingPage.quoteProvider).toHaveText(bestBuyProvider);
            await tradingPage.compareButton.click();
        });

        await test.step('Check compared offers', async () => {
            await expect(tradingPage.youPayFiatInput).toHaveValue(formattedFiatWithoutSymbol);
            await expect(tradingPage.refreshTime).toHaveText(/Offers refresh in(0:2[5-9]|0:30)/);
            await expect(tradingPage.youPayFiatInput).toHaveValue(localizeNumber(fiatAmount));
            await expect(tradingPage.paymentMethodDropdown).toHaveText(paymentMethodName);
            await tradingPage.validateBuyQuotes(buyQuotesBTC);
        });

        await test.step('Change payment method to Bank Transfer', async () => {
            await tradingPage.selectPaymentMethod('bankTransfer');
            await tradingPage.validateBuyQuotes(buyQuotesBTC);
        });

        await test.step('Change fiat input to trigger offer update', async () => {
            await page.route(invityEndpoint.buyQuotes, async route => {
                await route.fulfill({ json: buyQuotesBTCUpdate });
            });
            const quoteRequestPromise = page.waitForRequest(invityEndpoint.buyQuotes);
            await tradingPage.youPayFiatInput.fill(updateFiatAmount);
            await quoteRequestPromise;
            await tradingPage.validateBuyQuotes(buyQuotesBTCUpdate);
        });

        await test.step('Select second offer', async () => {
            await tradingPage.selectThisQuoteButton.nth(1).click();
        });

        await test.step('Confirm trade and verifies confirmation summary', async () => {
            await tradingPage.confirmTrade('Bitcoin #1', receiveAddress);
            await expect(tradingPage.confirmationAddress).toHaveText(receiveAddress);
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedUpdateFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(secondOfferCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(secondOfferProvider);
            await expect(tradingPage.confirmationPaymentMethod).toHaveText('Bank Transfer');
            await expect(tradingPage.finishTransactionButton).toBeEnabled();
        });
    });

    test('Buy Bitcoin from best offer', async ({ page, tradingPage, tradingMock }) => {
        await test.step('Request a trade', async () => {
            await tradingPage.fillBuyForm(fiatAmount);
            await tradingPage.buyBestOfferButton.click();
            await tradingPage.confirmTrade('Bitcoin #1', receiveAddress);
        });

        await page.clock.install();

        await test.step('Confirm the trade and get redirected to transaction detail', async () => {
            await tradingMock.changeBuyWatchResponseTo('SUBMITTED');
            const tradeRequestPromise = page.waitForRequest(invityEndpoint.buyTrade);
            const watchRequestPromise = page.waitForRequest(invityEndpoint.buyWatch);
            await tradingPage.finishTransactionButton.click();
            await expect(tradeRequestPromise).toHavePayload(invityRequest.buyTradeBTCPayload, {
                omit: ['returnUrl', 'trade.orderId', 'trade.paymentId'],
            });
            await expect(watchRequestPromise).toHavePayload(invityRequest.buyWatchPayload, {
                omit: ['partnerData', 'orderId', 'paymentId'],
            });
            await expect(tradingPage.transactionDetailStatus).toHaveText(
                'Waiting for your payment...',
            );
            await expect(tradingPage.proceedToPayButton).toBeVisible();
        });

        await test.step('Wait 30s for watch refresh and status change to Approved', async () => {
            await tradingMock.changeBuyWatchResponseTo('SUCCESS');
            await page.clock.fastForward(tradingMock.watchPeriod);
            await expect(tradingPage.transactionDetailStatus).toHaveText('Approved');
            await expect(tradingPage.confirmationFiatAmount).toHaveText(formattedFiatAmount);
            await expect(tradingPage.confirmationCryptoAmount).toHaveText(bestBuyCryptoAmount);
            await expect(tradingPage.confirmationProvider).toHaveText(bestBuyProvider);
        });

        await test.step('Return to account buy form', async () => {
            await tradingPage.backToAccountButton.click();
            await expect(page).toHaveURL(/\/accounts\/coinmarket\/buy#\/btc\/0\/normal$/);
        });
    });

    test('Choose different Bitcoin receive address', async ({
        page,
        tradingPage,
        devicePrompt,
        trezorUserEnvLink,
    }) => {
        const differentAddress = allAvailableAddressesBTC[5];

        await test.step('Request a trade', async () => {
            await tradingPage.fillBuyForm(fiatAmount);
            await tradingPage.buyBestOfferButton.click();
        });

        await test.step('Confirm the first receive address', async () => {
            await tradingPage.confirmTrade('Bitcoin #1', receiveAddress);
            await expect(tradingPage.finishTransactionButton).toBeEnabled();
        });

        await test.step('Change the receive address', async () => {
            await tradingPage.confirmationAddress.click();
            // Adding retry because of the dropdown animation
            await expect(async () => {
                const allAddressesFromDropdown = await page
                    .getByRole('option')
                    .getByTestId('@trading/form/verify/address')
                    .allTextContents();
                expect(allAddressesFromDropdown).toEqual(allAvailableAddressesBTC);
            }).toPass({ timeout: 3_000 });
            await page.getByRole('option', { name: differentAddress }).click();
            await expect(tradingPage.finishTransactionButton).toBeHidden();
        });

        await test.step('Confirm the changed receive address', async () => {
            await tradingPage.confirmOnTrezorButton.click();
            await expect(devicePrompt.headerParagraph).toHaveText('Bitcoin #1');
            await devicePrompt.confirmOnDevicePromptIsShown();
            await expect(devicePrompt.outputValueOf('address')).toHaveText(
                formatAddress(differentAddress),
            );
            await expect(devicePrompt).toDisplayReceiveAddress(differentAddress);
            await trezorUserEnvLink.pressYes();
            await expect(tradingPage.finishTransactionButton).toBeEnabled();
        });
    });
});
