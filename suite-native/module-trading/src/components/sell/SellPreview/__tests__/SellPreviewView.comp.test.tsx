import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { sellQuotes } from '../../../../__fixtures__/sellQuotes';
import { getWalletState } from '../../../../__fixtures__/walletState';
import { SellPreviewView, SellPreviewViewProps } from '../SellPreviewView';

describe('SellPreviewView', () => {
    const renderSellPreviewView = (props: Partial<SellPreviewViewProps> = {}) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'sell' }),
        };
        preloadedState.wallet!.trading!.composedTransactionInfo = { composed: { fee: '1000' } };
        preloadedState.wallet!.trading!.sell!.tradingAccountKey = 'eth-account-1';

        return renderWithStoreProviderAsync(
            <SellPreviewView quote={sellQuotes[0]} txnErrorString={null} {...props} />,
            { preloadedState },
        );
    };

    it('should render all sections except alert', async () => {
        const { getByText } = await renderSellPreviewView({});

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Credit/Debit Card')).toBeOnTheScreen();
    });

    it('should render txnErrorString when isTxnError is true', async () => {
        const { getByText } = await renderSellPreviewView({
            txnErrorString: 'Transaction error occurred',
        });

        expect(getByText('From')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('To')).toBeOnTheScreen();
        expect(getByText('Credit/Debit Card')).toBeOnTheScreen();
        expect(getByText('Transaction error occurred')).toBeOnTheScreen();
    });
});
