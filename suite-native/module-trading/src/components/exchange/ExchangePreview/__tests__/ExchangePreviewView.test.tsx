import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils';
import {
    exchangeQuotes,
    getWalletState,
    mercuryoFixedWorstQuote,
} from '@suite-native/trading-fixtures';

import { ExchangePreviewView, type ExchangePreviewViewProps } from '../ExchangePreviewView';

describe('ExchangePreviewView', () => {
    const renderExchangePreviewView = (props: Partial<ExchangePreviewViewProps> = {}) => {
        const preloadedState: PreloadedState = {
            wallet: getWalletState({ tradeType: 'exchange' }),
        };
        preloadedState.wallet!.trading!.composedTransactionInfo = { composed: { fee: '1000' } };
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = 'btc-account-1';
        preloadedState.wallet!.trading!.exchange!.receiveAccountKey = 'eth-account-1';
        preloadedState.wallet!.trading!.exchange!.lastErrorMessage = 'ERROR_MESSAGE';

        return renderWithStoreProvider(
            <ExchangePreviewView
                quote={mercuryoFixedWorstQuote}
                txnErrorString={null}
                {...props}
            />,
            { preloadedState },
        );
    };

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should render all sections except alert', () => {
        const { getByText } = renderExchangePreviewView({});

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('Fee')).toBeOnTheScreen();
        expect(getByText('ERROR_MESSAGE')).toBeOnTheScreen();
    });

    // Todo: https://github.com/trezor/trezor-suite/issues/24906
    it.skip('should render txnErrorString but no fee picker when isTxnError is true', () => {
        const { getByText, queryByText } = renderExchangePreviewView({
            txnErrorString: 'txnErrorString',
        });

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('Ethereum #1')).toBeOnTheScreen();
        expect(getByText('txnErrorString')).toBeOnTheScreen();
        expect(queryByText('Fee')).toBeNull();
    });

    it('should render 1Inch Fusion+ info when exchange is 1inchfusionplus', () => {
        const fusionQuote = exchangeQuotes.find(q => q.exchange === '1inchfusionplus');
        const { getByText } = renderExchangePreviewView({
            quote: fusionQuote,
        });

        expect(getByText('You are swapping with 1Inch Fusion+')).toBeOnTheScreen();
    });

    it('should not render 1Inch Fusion+ info when exchange is not 1inchfusionplus', () => {
        const nonFusionQuote = exchangeQuotes.find(q => q.exchange === 'mercuryo');
        const { queryByText } = renderExchangePreviewView({
            quote: nonFusionQuote,
        });

        expect(queryByText('You are swapping with 1Inch Fusion+')).toBeNull();
    });
});
