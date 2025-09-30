import { PreloadedState, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { exchangeQuotes } from '../../../../__fixtures__/exchangeQuotes';
import { getWalletState } from '../../../../__fixtures__/walletState';
import { ExchangePreviewView, ExchangePreviewViewProps } from '../ExchangePreviewView';

describe('ExchangePreviewView', () => {
    const renderExchangePreviewView = (props: Partial<ExchangePreviewViewProps> = {}) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
        preloadedState.wallet!.trading!.composedTransactionInfo = { composed: { fee: '1000' } };
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = 'btc-account-1';
        preloadedState.wallet!.trading!.exchange!.receiveAccountKey = 'eth-account-1';

        return renderWithStoreProviderAsync(
            <ExchangePreviewView quote={exchangeQuotes[0]} txnErrorString={null} {...props} />,
            { preloadedState },
        );
    };

    it('should render all sections except alert', async () => {
        const { getByText } = await renderExchangePreviewView({});

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('Fee')).toBeOnTheScreen();
    });

    it('should render txnErrorString but no fee picker when isTxnError is true', async () => {
        const { getByText, queryByText } = await renderExchangePreviewView({
            txnErrorString: 'txnErrorString',
        });

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('txnErrorString')).toBeOnTheScreen();
        expect(queryByText('Fee')).toBeNull();
    });
});
