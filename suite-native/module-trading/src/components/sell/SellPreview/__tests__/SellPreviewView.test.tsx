import { getTranslation } from '@suite-native/intl';
import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import {
    banxaBankTransferSellQuote,
    banxaCreditCardSellQuote,
    eth1NormalAccount,
    getSellTrade,
    getWalletState,
} from '@suite-native/trading-fixtures';

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

    const getPreloadedSellState = (overrides: { formStep?: string }): PreloadedState => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.composedTransactionInfo = { composed: { fee: '1000' } };
        preloadedState.wallet!.trading!.sell!.tradingAccountKey = eth1NormalAccount.key;
        preloadedState.wallet!.trading!.sell!.selectedQuote = banxaBankTransferSellQuote;
        preloadedState.wallet!.trading!.trades = [getSellTradeWithBankAccounts()];
        preloadedState.wallet!.trading!.providerConfirmationStatus = 'confirmation_success';

        Object.assign(preloadedState.wallet!.trading!.sell!, overrides);

        return preloadedState;
    };

    const renderSellPreviewView = (
        props: Partial<SellPreviewViewProps> = {},
        preloadedStateOverrides?: { formStep?: string },
    ) => {
        const preloadedState = getPreloadedSellState(preloadedStateOverrides ?? {});

        return renderWithStoreProvider(
            <SellPreviewView quote={banxaBankTransferSellQuote} txnErrorString={null} {...props} />,
            {
                preloadedState,
            },
        );
    };

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
        const { queryByTestId } = renderSellPreviewView(
            {},
            {
                formStep: 'SEND_TRANSACTION', // Not BANK_ACCOUNT
            },
        );

        expect(queryByTestId(BANK_ACCOUNT_ITEM_TEST_ID)).not.toBeOnTheScreen();
    });

    it('should render bank account picker when form step is BANK_ACCOUNT', () => {
        const { getAllByTestId } = renderSellPreviewView(
            {},
            {
                formStep: 'BANK_ACCOUNT',
            },
        );

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
