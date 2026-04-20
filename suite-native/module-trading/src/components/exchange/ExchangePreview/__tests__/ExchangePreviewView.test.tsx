import { type AccountKey } from '@suite-common/wallet-types';
import {
    btc1NormalAccount,
    cexdirectFloatingQuote,
    eth1NormalAccount,
    mercuryoFixedWorstQuote,
    oneInchFusionPlusQuote,
} from '@suite-native/trading-fixtures';

import { renderWithTradingProvider } from '../../../../__tests__/tradingTestUtils';
import { ExchangePreviewView, type ExchangePreviewViewProps } from '../ExchangePreviewView';

describe('ExchangePreviewView', () => {
    const renderExchangePreviewView = (props: Partial<ExchangePreviewViewProps> = {}) =>
        renderWithTradingProvider(
            <ExchangePreviewView
                quote={mercuryoFixedWorstQuote}
                txnErrorString={null}
                {...props}
            />,
            {
                tradeType: 'exchange',
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
                            exchange: {
                                tradingAccountKey: btc1NormalAccount.key as AccountKey,
                                receiveAccountKey: eth1NormalAccount.key as AccountKey,
                                lastErrorMessage: 'ERROR_MESSAGE',
                            },
                        },
                    },
                },
            },
        );

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
        const { getByText } = renderExchangePreviewView({
            quote: oneInchFusionPlusQuote,
        });

        expect(getByText('You are swapping with 1Inch Fusion+')).toBeOnTheScreen();
    });

    it('should not render 1Inch Fusion+ info when exchange is not 1inchfusionplus', () => {
        const { queryByText } = renderExchangePreviewView({
            quote: mercuryoFixedWorstQuote,
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
