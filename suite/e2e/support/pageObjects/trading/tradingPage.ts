import { Locator, Page } from '@playwright/test';
import { CryptoId } from 'invity-api';

import { messages } from '@suite/intl';
import { TradingCountryCode } from '@suite-common/trading';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { TradingAssetsModal } from './assetsModal';
import { TradingConfirmationModal } from './confirmationModal';
import { DevicePrompt } from '../devicePrompt';
import { FeeSection } from './feeSection';
import { TradingFormInputs } from './formInputs';
import { TradingQuotesSection } from './quotesSection';
import { TradingReceiveAccount } from './receiveAccount';
import { invityEndpoint } from '../../../fixtures/invity';
import { step } from '../../common';
import { expect } from '../../testExtends/customMatchers';

export class TradingPage {
    readonly fees: FeeSection;
    readonly assets: TradingAssetsModal;
    readonly receiveAccount: TradingReceiveAccount;
    readonly quotes: TradingQuotesSection;
    readonly confirmation: TradingConfirmationModal;
    readonly inputs: TradingFormInputs;

    // Navigation and action buttons
    readonly section: Locator;
    readonly buyButton: Locator;
    readonly sellTabButton: Locator;
    readonly buyBestOfferButton: Locator;
    readonly sellBestOfferButton: Locator;
    readonly swapBestOfferButton: Locator;
    readonly buyOffersPage: Locator;
    readonly proceedToPayButton: Locator;
    readonly backToAccountButton = (type: 'Buy' | 'Sell' | 'Swap') =>
        this.page.getByRole('button', { name: `Make another ${type}` });

    // Send fields and buttons
    readonly sendAddressInput: Locator;
    readonly sendAmountInput: Locator;
    readonly sendButton: Locator;
    readonly sendBalance: Locator;
    readonly setMax: Locator;

    // Transactions
    readonly transactionDetailStatus: Locator;

    constructor(
        private page: Page,
        devicePrompt: DevicePrompt,
    ) {
        this.fees = new FeeSection(page);
        this.assets = new TradingAssetsModal(page);
        this.receiveAccount = new TradingReceiveAccount(page);
        this.quotes = new TradingQuotesSection(page);
        this.confirmation = new TradingConfirmationModal(page, devicePrompt);
        this.inputs = new TradingFormInputs(page);

        this.section = this.page.getByTestId('@trading');
        this.buyButton = this.page.getByTestId('@trading/menu/wallet-trading-buy');
        this.sellTabButton = this.page.getByTestId('@trading/menu/wallet-trading-sell');
        this.buyBestOfferButton = this.page.getByTestId('@trading/form/buy-button');
        this.sellBestOfferButton = this.page.getByTestId('@trading/form/sell-button');
        this.swapBestOfferButton = this.page.getByTestId('@trading/form/exchange-button');
        this.buyOffersPage = this.page.getByTestId('@trading/buy-offers');
        this.proceedToPayButton = this.page.getByRole('button', { name: 'Proceed to pay' });

        // Swap
        this.sendAddressInput = this.page.getByTestId('outputs.0.address');
        this.sendAmountInput = this.page.getByTestId('outputs.0.amount');
        this.sendButton = this.page.getByTestId('@send/review-button');
        this.sendBalance = this.page.getByTestId('outputs.0.token');
        this.setMax = this.page.getByTestId('outputs.0.setMax');

        // Transactions
        this.transactionDetailStatus = this.page.getByTestId('@trading/transaction/detail/status');
    }

    @step()
    async fillBuyForm({
        amount,
        cryptoCurrency = 'bitcoin',
        wantCrypto = false,
        fiatCurrencyCode = 'czk',
        country = 'CZ',
        selectReceiveAddress,
    }: {
        amount: string;
        cryptoCurrency?: string;
        wantCrypto?: boolean;
        fiatCurrencyCode?: BaseCurrencyCode;
        country?: TradingCountryCode;
        selectReceiveAddress?: () => Promise<void>;
    }) {
        const inputField = wantCrypto ? this.inputs.cryptoAmount : this.inputs.fiatAmount;
        await expect(inputField).toHaveValue('');
        if (wantCrypto) {
            // The desired value is already set due to sideeffect of mocked response,
            // We clear it so we can intercept and verify request payload that is triggered by filling value.
            await inputField.fill('');
        }
        await this.inputs.selectCountryOfResidence(country);
        await this.inputs.selectFiatCurrency(fiatCurrencyCode);

        if (selectReceiveAddress) {
            await selectReceiveAddress();
        }

        const quotesRequestPromise = this.page.waitForRequest(invityEndpoint.buyQuotes);
        const quotesResponsePromise = this.page.waitForResponse(invityEndpoint.buyQuotes);
        await inputField.fill(amount);
        await expect.soft(quotesRequestPromise).toHavePayload({
            wantCrypto,
            fiatCurrency: fiatCurrencyCode.toUpperCase(),
            receiveCurrency: cryptoCurrency,
            country,
            ...(wantCrypto ? { cryptoStringAmount: amount } : { fiatStringAmount: amount }),
        });
        await quotesResponsePromise;
        await this.quotes.waitForSync();
    }

    @step()
    async fillSellForm({
        cryptoAmount,
        networkSymbolOrTokenId = 'btc',
        cryptoCurrency = 'bitcoin',
        fiatCurrencyCode = 'eur',
        country = 'CZ',
    }: {
        cryptoAmount: string;
        networkSymbolOrTokenId?: string;
        cryptoCurrency?: string;
        fiatCurrencyCode?: BaseCurrencyCode;
        country?: TradingCountryCode;
    }) {
        await this.inputs.selectCountryOfResidence(country);
        await this.inputs.selectFiatCurrency(fiatCurrencyCode);
        const isFiatRateLoadingFlag = `wallet.fiat.current.${networkSymbolOrTokenId}-${fiatCurrencyCode}.isLoading`;
        await this.page.expectReduxObjectToEqual(isFiatRateLoadingFlag, false);
        const quoteRequestPromise = this.page.waitForRequest(invityEndpoint.sellQuotes);
        await this.inputs.cryptoAmount.fill(cryptoAmount);
        await expect(
            this.page.getByText(messages['AMOUNT_IS_NOT_ENOUGH'].defaultMessage),
            'Insufficient funds in the account to run sell flow test. Please contact the "tech_qa" Slack group immediately.',
        ).toBeHidden();
        await expect.soft(quoteRequestPromise).toHavePayload(
            {
                amountInCrypto: true,
                cryptoCurrency,
                fiatCurrency: fiatCurrencyCode.toUpperCase(),
                country,
                cryptoStringAmount: cryptoAmount,
                flows: ['BANK_ACCOUNT', 'PAYMENT_GATE'],
            },
            { omit: ['fiatStringAmount'] },
        );
        await this.quotes.waitForSync();
    }

    @step()
    async fillSellFormMinimumQuoteError(
        amount: string = '0.00000001',
        country: TradingCountryCode = 'CZ',
    ) {
        await this.inputs.selectCountryOfResidence(country);
        await this.inputs.cryptoAmount.fill(amount);
        await this.page.waitForRequest(invityEndpoint.sellQuotes);
        await expect(
            this.page.getByText(messages['AMOUNT_IS_NOT_ENOUGH'].defaultMessage),
            'Insufficient funds in the account to run sell flow test. Please contact the "tech_qa" Slack group immediately.',
        ).toBeHidden();

        await expect(this.quotes.loadingSpinner).toBeHidden({ timeout: 30000 });
    }

    @step()
    async fillSwapForm({
        sellAsset,
        buyAsset,
        receiveAddress,
        selectReceiveAddress,
        amount,
    }: {
        amount: string;
        sellAsset: Parameters<TradingAssetsModal['selectSellAsset']>[0] & {
            assetCryptoId: CryptoId;
        };
        buyAsset: Omit<Parameters<TradingAssetsModal['selectBuyAsset']>[0], 'assetCryptoId'> & {
            assetCryptoId: CryptoId;
        };
        receiveAddress?: string;
        selectReceiveAddress?: () => Promise<void>;
    }) {
        await this.assets.selectSellAsset(sellAsset);
        await this.assets.selectBuyAsset(buyAsset);

        // We should not fill in amount until account change takes effect = correct ticker is displayed
        await expect(this.inputs.swapAmountCurrencyTicker).toHaveText(
            sellAsset.tokenSymbol ?? sellAsset.networkSymbol ?? '',
            { ignoreCase: true },
        );

        if (selectReceiveAddress) {
            await selectReceiveAddress();
        }

        const quotesRequestPromise = this.page.waitForRequest(invityEndpoint.swapQuotes);
        const quotesResponsePromise = this.page.waitForResponse(invityEndpoint.swapQuotes);
        await expect(this.quotes.bestOfferAmount).toHaveText(/0 \w+/);
        await this.inputs.cryptoAmount.fill(amount);
        await quotesResponsePromise;
        await this.quotes.waitForSync();
        await expect.soft(quotesRequestPromise).toHavePayload(
            {
                receive: buyAsset.assetCryptoId,
                send: sellAsset.assetCryptoId,
                sendStringAmount: amount,
                dex: 'enable',
                receiveAddress,
            },
            { omit: ['fromAddress'] },
        );
    }

    @step()
    async clickSwapBestOfferAndWaitForFees() {
        // The suite does not wait for these responses and it causes flakiness in automation.
        // Toast error: 'Transaction signing error: Missing composed data' and not possible to send.
        // So we have to wait for them manually.
        const swapFeeCallsPromise = this.fees.promiseForResponseSolanaFeeCalls();
        await this.swapBestOfferButton.click();
        await swapFeeCallsPromise;
    }

    @step()
    async waitForRedirectCompletion() {
        await expect(this.page.getByText('Buy & sell')).toBeHidden();
        await expect(this.page.getByText('Buy & sell')).toBeVisible({ timeout: 30_000 });
    }

    @step()
    async verifyBuyFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.assets.buyAssetPickerDisplaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('You buy')).toBeVisible();
    }

    @step()
    async verifySellFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.assets.sellAssetPickerDisplaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('You sell')).toBeVisible();
    }

    @step()
    async verifySwapFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.assets.sellAssetPickerDisplaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('Swap amount')).toBeVisible();
    }
}
