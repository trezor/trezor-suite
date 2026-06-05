import {
    btc1NormalAccount,
    cexdirectFloatingQuote,
    eth1NormalAccount,
    mercuryoFixedWorstQuote,
    oneInchFusionPlusWithEip712SignDataQuote,
    oneInchFusionPlusWithoutEip712SignDataQuote,
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
                                tradingAccountKey: btc1NormalAccount.key,
                                receiveAccountKey: eth1NormalAccount.key,
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

    it('should render EIP-712 info with provider name when quote has EIP-712 sign data', () => {
        const { getByText } = renderExchangePreviewView({
            quote: oneInchFusionPlusWithEip712SignDataQuote,
        });

        expect(getByText(/^You are swapping with 1inch Fusion\+$/)).toBeOnTheScreen();
    });

    it('should not render transaction fee for quotes with EIP-712 sign data', () => {
        const { queryByText } = renderExchangePreviewView({
            quote: oneInchFusionPlusWithEip712SignDataQuote,
        });

        expect(queryByText('Transaction fee')).toBeNull();
    });

    it('should not render EIP-712 info when quote has no EIP-712 sign data', () => {
        const { queryByText } = renderExchangePreviewView({
            quote: oneInchFusionPlusWithoutEip712SignDataQuote,
        });

        expect(queryByText(/^You are swapping with /)).toBeNull();
    });

    it('should render KYC warning for provider with "KYC-required"', () => {
        const { getByText } = renderExchangePreviewView({
            quote: cexdirectFloatingQuote,
        });

        expect(getByText('This provider requires KYC.')).toBeOnTheScreen();
    });

    it('should not render KYC provider warning for providers with "noKYC"', () => {
        const { queryByText } = renderExchangePreviewView({
            quote: mercuryoFixedWorstQuote,
        });

        expect(queryByText('This provider requires identity verification.')).toBeNull();
    });
});
