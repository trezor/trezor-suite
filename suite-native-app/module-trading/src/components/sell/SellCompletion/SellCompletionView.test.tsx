import { mockNetworksServices } from '@suite-common/networks/mocks';
import { type TradingSellStepType } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import {
    banxaBankTransferSellQuote,
    banxaCreditCardSellQuote,
    eth1NormalAccount,
    getSellTrade,
} from '@suite-native/trading-fixtures';
import type { ProviderConfirmationStatus } from '@suite-native/trading-types';

import { BANK_ACCOUNT_ITEM_TEST_ID } from './BankAccount/SellBankAccountItem';
import { SellCompletionView, type SellCompletionViewProps } from './SellCompletionView';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

const FEE_SELECTOR_ROW_TEST_ID = '@transactionManagement/fee-selector-row';

describe('SellCompletionView', () => {
    const getSellTradeWithBankAccounts = () => ({
        ...getSellTrade({ status: undefined }),
        data: {
            ...getSellTrade({ status: undefined }).data,
            orderId: banxaBankTransferSellQuote.orderId,
            bankAccounts: banxaBankTransferSellQuote.bankAccounts,
        },
    });

    const getOverrides = (
        formStep?: TradingSellStepType,
        providerConfirmationStatus: ProviderConfirmationStatus = 'confirmation_success',
    ): PreloadedStatePartial<TradingTestPreloadedState> => ({
        wallet: {
            trading: {
                composedTransactionInfo: {
                    composed: {
                        fee: '1000',
                        feePerByte: '1',
                        feeLimit: '21000',
                        estimatedFeeLimit: '21000',
                    },
                },
                sell: {
                    tradingAccountKey: eth1NormalAccount.key,
                    selectedQuote: banxaBankTransferSellQuote,
                    ...(formStep !== undefined && { formStep }),
                },
                trades: [getSellTradeWithBankAccounts()],
                providerConfirmationStatus,
            },
        },
    });

    const renderSellCompletionView = (
        props: Partial<SellCompletionViewProps> = {},
        formStep?: TradingSellStepType,
        providerConfirmationStatus?: ProviderConfirmationStatus,
    ) =>
        renderWithTradingProvider(
            <SellCompletionView
                quote={banxaBankTransferSellQuote}
                txnErrorString={null}
                shouldShowFee={false}
                {...props}
            />,
            {
                tradeType: 'sell',
                overrides: getOverrides(formStep, providerConfirmationStatus),
                services: { networks: mockNetworksServices() },
            },
        );

    it('renders the sell summary', async () => {
        const { getByText } = await renderSellCompletionView();

        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.youPay')),
        ).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.youGet')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.paymentMethods.bankTransfer')),
        ).toBeOnTheScreen();
    });

    it('renders the transaction error', async () => {
        const { getByText } = await renderSellCompletionView({
            txnErrorString: 'Transaction error occurred',
        });

        expect(getByText('Transaction error occurred')).toBeOnTheScreen();
    });

    it('renders the fee selector and leaves the transaction error to it', async () => {
        const { getByTestId, queryByText } = await renderSellCompletionView({
            txnErrorString: 'Transaction error occurred',
            shouldShowFee: true,
        });

        expect(getByTestId(FEE_SELECTOR_ROW_TEST_ID)).toBeOnTheScreen();
        expect(queryByText('Transaction error occurred')).toBeNull();
    });

    it('renders the transaction error but no fee selector when the quote has an error', async () => {
        const { getByText, queryByTestId } = await renderSellCompletionView({
            quote: { ...banxaBankTransferSellQuote, error: 'Quote error' },
            txnErrorString: 'Transaction error occurred',
            shouldShowFee: true,
        });

        expect(getByText('Transaction error occurred')).toBeOnTheScreen();
        expect(queryByTestId(FEE_SELECTOR_ROW_TEST_ID)).toBeNull();
    });

    it('renders the transaction error but no fee selector until the provider confirms the trade', async () => {
        const { getByText, queryByTestId } = await renderSellCompletionView(
            { txnErrorString: 'Transaction error occurred', shouldShowFee: true },
            undefined,
            'window_closed_with_success',
        );

        expect(getByText('Transaction error occurred')).toBeOnTheScreen();
        expect(queryByTestId(FEE_SELECTOR_ROW_TEST_ID)).toBeNull();
    });

    it('renders bank accounts during the bank account step', async () => {
        const { getAllByTestId } = await renderSellCompletionView({}, 'BANK_ACCOUNT');

        expect(getAllByTestId(BANK_ACCOUNT_ITEM_TEST_ID).length).toBeGreaterThan(0);
    });

    it('renders the quote passed to the view', async () => {
        const { getByText } = await renderSellCompletionView({
            quote: banxaCreditCardSellQuote,
        });

        expect(
            getByText(getTranslation('moduleTrading.paymentMethods.creditCard')),
        ).toBeOnTheScreen();
    });
});
