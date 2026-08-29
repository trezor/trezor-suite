import { Locator, Page } from '@playwright/test';
import type { ExchangeTrade } from 'invity-api';

import { messages } from '@suite/intl';
import type { TradingCountryCode } from '@suite-common/trading';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { TradingApprovalModal } from './approvalModal';
import { TradingAssetPicker } from './assetsModal';
import { TradingConfirmationModal } from './confirmationModal';
import { TradingTransactionsSection } from './transactionsSection';
import { DevicePrompt } from '../devicePrompt';
import { FeeSection } from './feeSection';
import { TradingFormInputs } from './formInputs';
import { TradingQuotesSection } from './quotesSection';
import { TradingReceiveAccount } from './receiveAccount';
import { TransactionDetailSidebar } from './transactionDetailSidebar';
import { tradeEndpoint } from '../../../fixtures/trading';
import { isDesktopProject, isWebProject, step } from '../../common';
import { expect } from '../../testExtends/customMatchers';
import { type PlaywrightTarget } from '../../testExtends/suiteTestOptions';
import { BuyAsset, SellAsset } from '../../types';

const LIVE_TRADE_RESPONSE_TIMEOUT = 90_000;

export class TradingPage {
    readonly fees: FeeSection;
    readonly assetPicker: TradingAssetPicker;
    readonly receiveAccount: TradingReceiveAccount;
    readonly quotes: TradingQuotesSection;
    readonly confirmation: TradingConfirmationModal;
    readonly approvalModal: TradingApprovalModal;
    readonly inputs: TradingFormInputs;
    readonly transactionDetailSidebar: TransactionDetailSidebar;

    // Navigation and action buttons
    readonly section: Locator;
    readonly buyButton: Locator;
    readonly sellTabButton: Locator;
    readonly buyBestOfferButton: Locator;
    readonly sellBestOfferButton: Locator;
    readonly swapBestOfferButton: Locator;
    readonly kycWarning: Locator;
    readonly proceedToPayButton: Locator;
    readonly approveSpendingButton: Locator;
    readonly pendingApprovalTransactionLabel: Locator;
    readonly pendingApprovalTransactionIdLabel: Locator;
    readonly pendingApprovalTransactionId: Locator;
    readonly swapButton: Locator;
    readonly backToAccountButton = (type: 'Buy' | 'Sell' | 'Swap') =>
        this.page.getByRole('button', { name: `Make another ${type}` });

    // Send fields and buttons
    readonly sendAddressInput: Locator;
    readonly sendAmountInput: Locator;
    readonly sendButton: Locator;
    readonly sendBalance: Locator;
    readonly setMax: Locator;

    // Transactions
    readonly backButton: Locator;
    readonly transactionDetailStatus: Locator;
    readonly transactionDetailHeader: Locator;
    readonly transactionDetail: Locator;
    readonly transactionDetailTxid: Locator;
    readonly transactions: TradingTransactionsSection;

    // Swap toast notifications
    readonly swapToastMessage: Locator;
    readonly swapToastSendAmount: Locator;
    readonly swapToastReceiveAmount: Locator;

    constructor(
        private page: Page,
        devicePrompt: DevicePrompt,
        private target: PlaywrightTarget,
    ) {
        this.fees = new FeeSection(page);
        this.assetPicker = new TradingAssetPicker(page);
        this.receiveAccount = new TradingReceiveAccount(page);
        this.quotes = new TradingQuotesSection(page);
        this.confirmation = new TradingConfirmationModal(page, devicePrompt);
        this.approvalModal = new TradingApprovalModal(page);
        this.inputs = new TradingFormInputs(page);
        this.transactionDetailSidebar = new TransactionDetailSidebar(page);

        this.section = this.page.getByTestId('@trading');
        this.buyButton = this.page.getByTestId('@trading/menu/wallet-trading-buy');
        this.sellTabButton = this.page.getByTestId('@trading/menu/wallet-trading-sell');
        this.buyBestOfferButton = this.page.getByTestId('@trading/form/buy-button');
        this.sellBestOfferButton = this.page.getByTestId('@trading/form/sell-button');
        this.swapBestOfferButton = this.page.getByTestId('@trading/form/exchange-button');
        this.kycWarning = this.page.getByTestId('@trading/form/kyc-warning');
        this.proceedToPayButton = this.page.getByRole('button', { name: 'Proceed to pay' });
        this.approveSpendingButton = this.page.getByTestId('@trading/form/approve-button');
        this.pendingApprovalTransactionLabel = this.page.getByTestId('@pending-transaction/title');
        this.pendingApprovalTransactionIdLabel = this.page.getByTestId(
            '@pending-transaction/txid/label',
        );
        this.pendingApprovalTransactionId = this.page.getByTestId(
            '@pending-transaction/txid/value',
        );
        this.swapButton = this.page.getByTestId('@trading/form/swap-button');

        // Swap
        this.sendAddressInput = this.page.getByTestId('outputs.0.address');
        this.sendAmountInput = this.page.getByTestId('outputs.0.amount');
        this.sendButton = this.page.getByTestId('@send/review-button');
        this.sendBalance = this.page.getByTestId('outputs.0.token');
        this.setMax = this.page.getByTestId('outputs.0.setMax');

        this.backButton = this.page.getByTestId('@account-subpage/back');
        this.transactionDetailStatus = this.page.getByTestId('@trading/transaction/detail/status');
        this.transactionDetailHeader = this.page.getByTestId('@trading/transaction/detail/header');
        this.transactionDetail = this.page.getByTestId('@trading/transaction/detail');
        this.transactionDetailTxid = this.page.getByTestId('@tx-detail/txid-value');
        this.transactions = new TradingTransactionsSection(page);

        // Swap toast notifications
        this.swapToastMessage = this.page.getByTestId('@toast/tx-exchange/message');
        this.swapToastSendAmount = this.page.getByTestId('@toast/tx-exchange/send-amount');
        this.swapToastReceiveAmount = this.page.getByTestId('@toast/tx-exchange/receive-amount');
    }

    /**
     * Fills the buy form with the specified amount and configuration.
     * Asset should be selected beforehand using asset picker.
     *
     * @param params - The buy form parameters
     * @param params.amount - The amount to buy (as a string, e.g., "1000", "0.01")
     * @param params.wantCrypto - Whether the amount is specified in crypto (true) or fiat (false). Default: false
     * @param params.fiatCurrencyCode - The fiat currency code (e.g., 'czk', 'eur', 'usd'). Default: 'czk'
     * @param params.country - The country code for residence (e.g., 'CZ', 'US', 'GB'). Default: 'CZ'
     * @param params.countrySubdivision - Optional subdivision code, required for countries with subdivisions (e.g., 'CA', 'NY' for US states)
     * @param params.selectReceiveAddress - Optional async callback to select a custom receive address
     *
     * @example
     * // Buy Bitcoin with fiat amount (CZK)
     * await tradingPage.fillBuyForm({
     *     amount: '1000',
     *     selectReceiveAddress: async () => {
     *         await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
     *     }
     * });
     *
     * @example
     * // Buy with EUR currency from specific country
     * await tradingPage.fillBuyForm({
     *     amount: '500',
     *     fiatCurrencyCode: 'eur',
     *     country: 'DE'
     * });
     *
     */
    @step()
    async fillBuyForm({
        amount,
        wantCrypto = false,
        fiatCurrencyCode = 'czk',
        country = 'CZ',
        countrySubdivision,
        selectReceiveAddress,
    }: {
        amount: string;
        wantCrypto?: boolean;
        fiatCurrencyCode?: BaseCurrencyCode;
        country?: TradingCountryCode;
        countrySubdivision?: string;
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
        if (countrySubdivision) {
            await this.inputs.selectCountrySubdivision(countrySubdivision);
        }
        await this.inputs.selectFiatCurrency(fiatCurrencyCode);

        if (selectReceiveAddress) {
            await selectReceiveAddress();
        }

        const quotesResponsePromise = this.page.waitForResponse(tradeEndpoint.buyQuotes);
        await inputField.fill(amount);
        await quotesResponsePromise;
        await this.quotes.waitForSync();
    }

    /**
     * Fills the sell form with the specified amount and configuration.
     * Asset should be selected beforehand using asset picker.
     *
     * @param params - The sell form parameters
     * @param params.cryptoAmount - The amount of crypto to sell (as a string, e.g., "0.001", "100")
     * @param params.networkSymbolOrTokenId - The network symbol or token ID to sell from. Default: 'btc'
     *   - For coins: 'btc', 'eth', 'sol'
     *   - For tokens: '{network}-{tokenAddress}' (e.g., 'eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48')
     * @param params.fiatCurrencyCode - The fiat currency code (e.g., 'eur', 'czk', 'usd'). Default: 'eur'
     * @param params.country - The country code for residence (e.g., 'CZ', 'US', 'GB'). Default: 'CZ'
     *
     * @example
     * // Sell Solana for EUR with explicit network symbol
     * await tradingPage.fillSellForm({
     *     cryptoAmount: '0.5',
     *     networkSymbolOrTokenId: 'sol',
     * });
     *
     * @example
     * // Sell Ethereum for CZK
     * await tradingPage.fillSellForm({
     *     cryptoAmount: '0.008',
     *     networkSymbolOrTokenId: 'eth',
     *     fiatCurrencyCode: 'czk'
     * });
     *
     * @example
     * // Sell Ethereum USDC token for EUR
     * await tradingPage.fillSellForm({
     *     cryptoAmount: '100',
     *     networkSymbolOrTokenId: 'eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
     * });
     *
     */
    @step()
    async fillSellForm({
        cryptoAmount,
        networkSymbolOrTokenId = 'btc',
        fiatCurrencyCode = 'eur',
        country = 'CZ',
    }: {
        cryptoAmount: string;
        networkSymbolOrTokenId?: string;
        cryptoCurrency?: string;
        fiatCurrencyCode?: BaseCurrencyCode;
        country?: TradingCountryCode;
    }) {
        // The form resets to its defaults once sellInfo lands, roughly 2s after it becomes interactive
        await this.page.expectReduxObjectNotToBeEmpty('wallet.trading.sell.sellInfo', {
            timeout: 30_000,
        });
        await this.inputs.selectCountryOfResidence(country);
        await this.inputs.selectFiatCurrency(fiatCurrencyCode);
        const isFiatRateLoadingFlag = `wallet.fiat.current.${networkSymbolOrTokenId}-${fiatCurrencyCode}.isLoading`;
        await this.page.expectReduxObjectToEqual(isFiatRateLoadingFlag, false);
        await this.inputs.cryptoAmount.fill(cryptoAmount);
        await expect(
            this.page.getByText(messages['AMOUNT_IS_NOT_ENOUGH'].defaultMessage),
            'Insufficient funds in the account to run sell flow test. Please contact the "tech_qa" Slack group immediately.',
        ).toBeHidden();
        await this.quotes.waitForSync();
    }

    @step()
    async fillSellFormMinimumQuoteError(
        amount: string = '0.00000001',
        country: TradingCountryCode = 'CZ',
    ) {
        await this.inputs.selectCountryOfResidence(country);
        await this.inputs.cryptoAmount.fill(amount);
        await this.page.waitForRequest(tradeEndpoint.sellQuotes);
        await expect(
            this.page.getByText(messages['AMOUNT_IS_NOT_ENOUGH'].defaultMessage),
            'Insufficient funds in the account to run sell flow test. Please contact the "tech_qa" Slack group immediately.',
        ).toBeHidden();

        await expect(this.quotes.loadingSpinner).toBeHidden({ timeout: 30000 });
    }

    /**
     * Fills the swap form with the specified sell and buy assets and amount.
     *
     * @param params - The swap form parameters
     * @param params.amount - The amount to swap (as a string, e.g., "0.001")
     * @param params.sellAsset - The asset to sell (required: networkSymbol)
     * @param params.sellAsset.networkSymbol - The network symbol to sell from (e.g., 'btc', 'eth', 'sol')
     * @param params.sellAsset.tokenSymbol - Optional token symbol if selling a token (e.g., 'USDT', 'USDC')
     * @param params.sellAsset.searchFilter - Optional search string to filter assets in picker (e.g., 'Solana #1', 'USDT')
     * @param params.sellAsset.networkFilter - Optional network filter ('all-networks' or specific network symbol like 'sol', 'btc')
     * @param params.buyAsset - The asset to buy (requires EITHER assetCryptoId OR networkSymbol, not both)
     * @param params.buyAsset.assetCryptoId - The Invity crypto ID for the asset to buy (e.g., token mint address for Solana tokens)
     * @param params.buyAsset.networkSymbol - Alternative to assetCryptoId: network symbol to buy (e.g., 'btc', 'eth')
     * @param params.buyAsset.tokenSymbol - Optional token symbol if buying a token (e.g., 'USDT', 'USDC')
     * @param params.buyAsset.searchFilter - Optional search string to filter assets in picker (e.g., 'Bitcoin', 'USDC')
     * @param params.buyAsset.networkFilter - Optional network filter ('all-networks' or specific network symbol like 'eth', 'btc')
     * @param params.selectReceiveAddress - Optional async callback to select a custom receive address (e.g., selecting specific account)
     *
     * @example
     * // Swap coin to coin (Solana to Bitcoin) with search filters
     * await tradingPage.fillSwapForm({
     *     amount: '0.001',
     *     sellAsset: {
     *         searchFilter: 'Solana #1',
     *         networkSymbol: 'sol'
     *     },
     *     buyAsset: {
     *         searchFilter: 'Bitcoin',
     *         assetCryptoId: getCryptoId('btc')
     *     },
     *     selectReceiveAddress: async () => {
     *         await tradingPage.receiveAccount.selectSuiteReceiveAccount(0, 'btc');
     *     }
     * });
     *
     *
     * @example
     * // Swap token to token (Solana USDT to Solana USDC) both using crypto IDs
     * await tradingPage.fillSwapForm({
     *     amount: '100',
     *     sellAsset: {
     *         networkFilter: 'sol',
     *         networkSymbol: 'sol',
     *         tokenSymbol: 'USDT',
     *         searchFilter: 'USDT'
     *     },
     *     buyAsset: {
     *         searchFilter: 'USDC',
     *         networkFilter: 'sol',
     *         assetCryptoId: usdcMint as CryptoId
     *     },
     *     selectReceiveAddress: async () => {
     *         await tradingPage.receiveAccount.selectSuiteReceiveAccount(0);
     *     }
     * });
     *
     */
    @step()
    async fillSwapForm({
        sellAsset,
        buyAsset,
        selectReceiveAddress,
        amount,
    }: {
        amount: string;
        sellAsset: SellAsset;
        buyAsset: BuyAsset;
        selectReceiveAddress?: () => Promise<void>;
    }) {
        await this.assetPicker.selectSellAsset(sellAsset);
        await this.assetPicker.selectBuyAsset(buyAsset);

        // We should not fill in amount until account change takes effect = correct ticker is displayed
        await expect(this.inputs.swapAmountCurrencyTicker).toHaveText(
            sellAsset.tokenSymbol ?? sellAsset.networkSymbol ?? '',
            { ignoreCase: true },
        );

        if (selectReceiveAddress) {
            await selectReceiveAddress();
        }

        const quotesResponsePromise = this.page.waitForResponse(tradeEndpoint.swapQuotes);
        await expect(this.quotes.bestOfferAmount).toHaveText(/0 \w+/);
        await this.inputs.cryptoAmount.fill(amount);
        await quotesResponsePromise;
        await this.quotes.waitForSync();
    }

    /**
     * @param params.sendAccount - The account label the swap is sent from (e.g., 'Solana #1')
     * @param params.receiveAccount - The account label the swap is received to (e.g., 'Bitcoin #1')
     * @param params.sendAmount - The expected send amount (e.g., '0.001')
     * @param params.receiveAmount - The expected receive amount exactly as the provider returned it (e.g., '0.07357510')
     */
    @step()
    async verifySwapToast({
        sendAccount,
        receiveAccount,
        sendAmount,
        receiveAmount,
    }: {
        sendAccount: string;
        receiveAccount: string;
        sendAmount: string;
        receiveAmount: string;
    }) {
        await expect(this.swapToastMessage).toHaveTranslation('TOAST_TX_EXCHANGE_BROADCASTED', {
            values: {
                sendAccount,
                receiveAccount,
            },
        });
        await expect(this.swapToastSendAmount).toHaveText(sendAmount);
        await expect(this.swapToastReceiveAmount).toHaveText(receiveAmount);
    }

    // temporary workaround which should be replaced with soon to be merged fixture tradingResponses
    @step()
    async waitForLiveTradeAmounts() {
        const response = await this.page.waitForResponse(tradeEndpoint.swapTrade, {
            timeout: LIVE_TRADE_RESPONSE_TIMEOUT,
        });
        const { sendStringAmount, receiveStringAmount } = (await response.json()) as ExchangeTrade;
        if (!sendStringAmount || !receiveStringAmount) {
            throw new Error(
                'Live trade response is missing sendStringAmount or receiveStringAmount',
            );
        }

        return { sendStringAmount, receiveStringAmount };
    }

    @step()
    async waitForSolanaFeesAndClickSwapBestOffer() {
        // The suite does not wait for solana fees to be calculated and it causes flakiness in automation.
        // Toast error: 'Transaction signing error: Missing composed data' and not possible to send.
        // So we have to wait for them manually.
        await expect(this.fees.maximumFeeAmountToBeCalculated).toBeHidden();
        await this.swapBestOfferButton.click();
    }

    @step()
    async waitForRedirectCompletion() {
        if (isDesktopProject(this.target)) {
            await expect(this.confirmation.confirmAndSendButton).toBeVisible({ timeout: 30_000 });
        } else if (isWebProject(this.target)) {
            const tradeHeading = this.page.getByRole('heading', { name: 'Trade' });

            await expect(tradeHeading).toBeHidden({ timeout: 30_000 });
            await expect(tradeHeading).toBeVisible({ timeout: 30_000 });
        }
    }

    @step()
    async verifyBuyFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.assetPicker.displaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('You buy')).toBeVisible();
    }

    @step()
    async verifySellFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.assetPicker.displaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('You sell')).toBeVisible();
    }

    @step()
    async verifySwapFormOpened(displaySymbol: RegExp) {
        await expect.soft(this.assetPicker.displaySymbol).toHaveText(displaySymbol);
        await expect.soft(this.page.getByText('Swap amount')).toBeVisible();
    }
}
