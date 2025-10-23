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
            <ExchangePreviewView quote={exchangeQuotes[0]} txnError={undefined} {...props} />,
            { preloadedState },
        );
    };

    it('should render all sections except alert', async () => {
        const { getByText } = await renderExchangePreviewView({});

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('Fee')).toBeOnTheScreen();
    });

    it('should render txnError but no fee picker when isTxnError is true', async () => {
        const { getByText, queryByText } = await renderExchangePreviewView({
            txnError: <>txnErrorString</>,
        });

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('txnErrorString')).toBeOnTheScreen();
        expect(queryByText('Fee')).toBeNull();
    });

    it('should render 1Inch Fusion+ info when exchange is 1inchfusionplus', async () => {
        const fusionQuote = exchangeQuotes.find(q => q.exchange === '1inchfusionplus');
        const { getByText } = await renderExchangePreviewView({
            quote: fusionQuote,
        });

        expect(getByText('You are swapping with 1Inch Fusion+')).toBeOnTheScreen();
    });

    it('should not render 1Inch Fusion+ info when exchange is not 1inchfusionplus', async () => {
        const nonFusionQuote = exchangeQuotes.find(q => q.exchange === 'mercuryo');
        const { queryByText } = await renderExchangePreviewView({
            quote: nonFusionQuote,
        });

        expect(queryByText('You are swapping with 1Inch Fusion+')).toBeNull();
    });
});
