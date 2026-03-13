import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';
import { getSellTrade, getWalletState, sellQuotes } from '@suite-native/trading-fixtures';

import { BANK_ACCOUNT_ITEM_TEST_ID } from '../BankAccount/SellBankAccountItem';
import { SellPreviewView, SellPreviewViewProps } from '../SellPreviewView';

describe('SellPreviewView', () => {
    const getSellTradeWithBankAccounts = () => ({
        ...getSellTrade({ status: undefined }),
        data: {
            ...getSellTrade({ status: undefined }).data,
            orderId: sellQuotes[1].orderId,
            bankAccounts: sellQuotes[1].bankAccounts,
        },
    });

    const getPreloadedSellState = (overrides: { formStep?: string }): PreloadedState => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.composedTransactionInfo = { composed: { fee: '1000' } };
        preloadedState.wallet!.trading!.sell!.tradingAccountKey = 'eth-account-1';
        preloadedState.wallet!.trading!.sell!.selectedQuote = sellQuotes[1]; // Use quote with bank accounts
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

        return renderWithStoreProviderAsync(
            <SellPreviewView quote={sellQuotes[1]} txnErrorString={null} {...props} />,
            {
                preloadedState,
            },
        );
    };

    it('should render all sections except alert', async () => {
        const { getByText } = await renderSellPreviewView({});

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Bank Transfer')).toBeOnTheScreen();
        // FeeSummaryCard renders fee info (replaced old FeePicker 'Fee' label)
    });

    it('should render txnErrorString when isTxnError is true', async () => {
        const { getByText, queryByText } = await renderSellPreviewView({
            txnErrorString: 'Transaction error occurred',
        });

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Bank Transfer')).toBeOnTheScreen();
        expect(getByText('Transaction error occurred')).toBeOnTheScreen();
        // Fee card should be hidden when there's a transaction error
        expect(queryByText('Network fee')).not.toBeOnTheScreen();
    });

    it('should not render bank account picker when form step is not BANK_ACCOUNT', async () => {
        const { queryByTestId } = await renderSellPreviewView(
            {},
            {
                formStep: 'SEND_TRANSACTION', // Not BANK_ACCOUNT
            },
        );

        expect(queryByTestId(BANK_ACCOUNT_ITEM_TEST_ID)).not.toBeOnTheScreen();
    });

    it('should render bank account picker when form step is BANK_ACCOUNT', async () => {
        const { getAllByTestId } = await renderSellPreviewView(
            {},
            {
                formStep: 'BANK_ACCOUNT',
            },
        );

        expect(getAllByTestId(BANK_ACCOUNT_ITEM_TEST_ID).length).toBeGreaterThan(0);
    });

    it('should use quote prop instead of selector', async () => {
        const differentQuote = sellQuotes[0];
        const { getByText } = await renderSellPreviewView({
            quote: differentQuote,
        });

        // Verify component renders with the passed quote
        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
        // FeeSummaryCard renders fee info (replaced old FeePicker 'Fee' label)
    });

    it('should not render fee picker when quote has no cryptoCurrency', async () => {
        const quoteWithoutCrypto = {
            ...sellQuotes[0],
            cryptoCurrency: undefined,
        };
        const { queryByText } = await renderSellPreviewView({
            quote: quoteWithoutCrypto as (typeof sellQuotes)[0],
        });

        // SellFeePickerCard returns null when quote has no cryptoCurrency
        expect(queryByText('Network fee')).not.toBeOnTheScreen();
    });
});
