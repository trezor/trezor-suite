import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { sellQuotes } from '../../../../__fixtures__/sellQuotes';
import { getSellTrade } from '../../../../__fixtures__/trades';
import { getWalletState } from '../../../../__fixtures__/walletState';
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

        Object.assign(preloadedState.wallet!.trading!.sell!, overrides);

        return preloadedState;
    };

    const renderSellPreviewView = (
        props: Partial<SellPreviewViewProps> = {},
        preloadedStateOverrides?: { formStep?: string },
    ) => {
        const preloadedState = getPreloadedSellState(preloadedStateOverrides ?? {});

        return renderWithStoreProviderAsync(<SellPreviewView txnErrorString={null} {...props} />, {
            preloadedState,
        });
    };

    it('should render all sections except alert', async () => {
        const { getByText } = await renderSellPreviewView({});

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Bank Transfer')).toBeOnTheScreen();
    });

    it('should render txnErrorString when isTxnError is true', async () => {
        const { getByText } = await renderSellPreviewView({
            txnErrorString: 'Transaction error occurred',
        });

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Bank Transfer')).toBeOnTheScreen();
        expect(getByText('Transaction error occurred')).toBeOnTheScreen();
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
});
