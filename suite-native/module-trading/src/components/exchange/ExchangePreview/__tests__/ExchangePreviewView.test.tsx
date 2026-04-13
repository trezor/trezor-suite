import { type PreloadedState, renderWithStoreProvider } from '@suite-native/test-utils-store';
import {
    btc1NormalAccount,
    cexdirectFloatingQuote,
    eth1NormalAccount,
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
        preloadedState.wallet!.trading!.exchange!.tradingAccountKey = btc1NormalAccount.key;
        preloadedState.wallet!.trading!.exchange!.receiveAccountKey = eth1NormalAccount.key;
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

    it('should render all sections except alert', () => {
        const { getByText } = renderExchangePreviewView({});

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('Transaction fee')).toBeOnTheScreen();
        expect(getByText('ERROR_MESSAGE')).toBeOnTheScreen();
    });

    it('should render txnErrorString but no fee picker when isTxnError is true', () => {
        const { getByText, queryByText } = renderExchangePreviewView({
            txnErrorString: 'txnErrorString',
        });

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('txnErrorString')).toBeOnTheScreen();
        expect(queryByText('Transaction fee')).toBeNull();
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

    it('should render KYC warning for provider with "KYC-required"', () => {
        const { getByText } = renderExchangePreviewView({
            quote: cexdirectFloatingQuote,
        });

        expect(getByText('This provider requires to verify identity.')).toBeOnTheScreen();
    });

    it('should not render KYC provider warning for providers with "noKYC"', () => {
        const { queryByText } = renderExchangePreviewView({
            quote: mercuryoFixedWorstQuote,
        });

        expect(queryByText('This provider requires to verify identity.')).toBeNull();
    });
});
