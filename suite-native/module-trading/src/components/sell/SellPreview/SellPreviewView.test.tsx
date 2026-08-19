import { type SellFiatTrade } from 'invity-api';

import { getTranslation } from '@suite-native/intl';
import {
    banxaBankTransferSellQuote,
    banxaCreditCardSellQuote,
    eth1NormalAccount,
    getSellTrade,
} from '@suite-native/trading-fixtures';

import { SellPreviewView } from './SellPreviewView';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

describe('SellPreviewView', () => {
    const renderSellPreviewView = (quote: SellFiatTrade = banxaBankTransferSellQuote) =>
        renderWithTradingProvider(<SellPreviewView quote={quote} />, {
            tradeType: 'sell',
            overrides: {
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
                            selectedQuote: quote,
                            formStep: 'BANK_ACCOUNT',
                        },
                        trades: [
                            {
                                ...getSellTrade({ status: undefined }),
                                data: {
                                    ...getSellTrade({ status: undefined }).data,
                                    orderId: quote.orderId,
                                    bankAccounts: quote.bankAccounts,
                                },
                            },
                        ],
                        providerConfirmationStatus: 'confirmation_success',
                    },
                },
            },
        });

    it('renders the sell summary', () => {
        const { getByText } = renderSellPreviewView();

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

    it('renders the quote passed to the view', () => {
        const { getByText } = renderSellPreviewView(banxaCreditCardSellQuote);

        expect(
            getByText(getTranslation('moduleTrading.paymentMethods.creditCard')),
        ).toBeOnTheScreen();
    });

    it('does not render completion-only bank account or fee controls', () => {
        const { queryByTestId } = renderSellPreviewView();

        expect(queryByTestId('@trading/sell/bank-account-item')).not.toBeOnTheScreen();
        expect(queryByTestId('@transactionManagement/fee-selector-row')).not.toBeOnTheScreen();
    });
});
