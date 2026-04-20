import { type TradingSellStepType } from '@suite-common/trading';
import { getTranslation } from '@suite-native/intl';
import {
    banxaBankTransferSellQuote,
    banxaCreditCardSellQuote,
    eth1NormalAccount,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../../__tests__/tradingTestUtils';
import { BANK_ACCOUNT_ITEM_TEST_ID } from '../BankAccount/SellBankAccountItem';
import { SellPreviewView, type SellPreviewViewProps } from '../SellPreviewView';

describe('SellPreviewView', () => {
    const getSellTradeWithBankAccounts = () => ({
        ...getSellTrade({ status: undefined }),
        data: {
            ...getSellTrade({ status: undefined }).data,
            orderId: banxaBankTransferSellQuote.orderId,
            bankAccounts: banxaBankTransferSellQuote.bankAccounts,
        },
    });

    const baseOverrides = (
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

    const renderSellPreviewView = (
        props: Partial<SellPreviewViewProps> = {},
        formStep?: TradingSellStepType,
    ) =>
        renderWithTradingProvider(
            <SellPreviewView quote={banxaBankTransferSellQuote} txnErrorString={null} {...props} />,
            {
                tradeType: 'sell',
                overrides: baseOverrides(formStep),
            },
        );

    it('should render all sections except alert', () => {
        const { getByText } = renderSellPreviewView({});

        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.fromAccount')),
        ).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.toFiat')),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradingSellPreviewScreen.paymentMethods.bankTransfer',
                ),
            ),
        ).toBeOnTheScreen();
    });

    it('should render txnErrorString when isTxnError is true', () => {
        const { getByText } = renderSellPreviewView({
            txnErrorString: 'Transaction error occurred',
        });

        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.fromAccount')),
        ).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.toFiat')),
        ).toBeOnTheScreen();
        expect(
            getByText(
                getTranslation(
                    'moduleTrading.tradingSellPreviewScreen.paymentMethods.bankTransfer',
                ),
            ),
        ).toBeOnTheScreen();
        expect(getByText('Transaction error occurred')).toBeOnTheScreen();
    });

    it('should not render bank account picker when form step is not BANK_ACCOUNT', () => {
        const { queryByTestId } = renderSellPreviewView({}, 'SEND_TRANSACTION');

        expect(queryByTestId(BANK_ACCOUNT_ITEM_TEST_ID)).not.toBeOnTheScreen();
    });

    it('should render bank account picker when form step is BANK_ACCOUNT', () => {
        const { getAllByTestId } = renderSellPreviewView({}, 'BANK_ACCOUNT');

        expect(getAllByTestId(BANK_ACCOUNT_ITEM_TEST_ID).length).toBeGreaterThan(0);
    });

    it('should use quote prop instead of selector', () => {
        const differentQuote = banxaCreditCardSellQuote;
        const { getByText } = renderSellPreviewView({
            quote: differentQuote,
        });

        // Verify component renders with the passed quote
        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.fromAccount')),
        ).toBeOnTheScreen();
        expect(
            getByText(getTranslation('moduleTrading.tradingSellPreviewScreen.toFiat')),
        ).toBeOnTheScreen();
    });

    it('should not render fee picker when quote has no cryptoCurrency', () => {
        const quoteWithoutCrypto = {
            ...banxaCreditCardSellQuote,
            cryptoCurrency: undefined,
        };
        const { queryByText } = renderSellPreviewView({ quote: quoteWithoutCrypto });

        expect(
            queryByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.details')),
        ).not.toBeOnTheScreen();
    });
});
