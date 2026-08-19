import { type TradingSellStepType } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import {
    banxaBankTransferSellQuote,
    banxaCreditCardSellQuote,
    eth1NormalAccount,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import { BANK_ACCOUNT_ITEM_TEST_ID } from './BankAccount/SellBankAccountItem';
import { SellCompletionView, type SellCompletionViewProps } from './SellCompletionView';
import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../test-utils/tradingTestUtils';

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
                providerConfirmationStatus: 'confirmation_success',
            },
        },
    });

    const renderSellCompletionView = (
        props: Partial<SellCompletionViewProps> = {},
        formStep?: TradingSellStepType,
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
                overrides: getOverrides(formStep),
            },
        );

    it('renders the sell summary', () => {
        const { getByText } = renderSellCompletionView();

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

    it('renders the transaction error', () => {
        const { getByText } = renderSellCompletionView({
            txnErrorString: 'Transaction error occurred',
        });

        expect(getByText('Transaction error occurred')).toBeOnTheScreen();
    });

    it('renders bank accounts during the bank account step', () => {
        const { getAllByTestId } = renderSellCompletionView({}, 'BANK_ACCOUNT');

        expect(getAllByTestId(BANK_ACCOUNT_ITEM_TEST_ID).length).toBeGreaterThan(0);
    });

    it('renders the quote passed to the view', () => {
        const { getByText } = renderSellCompletionView({
            quote: banxaCreditCardSellQuote,
        });

        expect(
            getByText(getTranslation('moduleTrading.paymentMethods.creditCard')),
        ).toBeOnTheScreen();
    });
});
