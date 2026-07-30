import { getTranslation } from '@suite-native/intl';
import { within } from '@suite-native/test-utils';
import {
    btc1NormalAccount,
    cexdirectFloatingQuote,
    eth1NormalAccount,
    mercuryoFixedWorstQuote,
    oneInchFusionPlusWithEip712SignDataQuote,
    oneInchFusionPlusWithoutEip712SignDataQuote,
} from '@suite-native/trading-fixtures';

import { ExchangePreviewView, type ExchangePreviewViewProps } from './ExchangePreviewView';
import { renderWithTradingProvider } from '../../../__tests__/tradingTestUtils';
import { useDexExchangeTxSimulation } from '../../../hooks/exchange/useDexExchangeTxSimulation';
import { useExchangeIssue } from '../../../hooks/exchange/useExchangeIssue';

jest.mock('../../../hooks/exchange/useDexExchangeTxSimulation', () => ({
    useDexExchangeTxSimulation: jest.fn(),
}));

jest.mock('../../../hooks/exchange/useExchangeIssue', () => ({
    useExchangeIssue: jest.fn(),
}));

const mockUseDexExchangeTxSimulation = jest.mocked(useDexExchangeTxSimulation);
const mockUseExchangeIssue = jest.mocked(useExchangeIssue);

describe('ExchangePreviewView', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: false,
            isLoading: false,
            error: null,
            data: undefined,
        });
        mockUseExchangeIssue.mockReturnValue({
            isSimulationEnabled: false,
            isSimulationLoading: false,
            issue: null,
        });
    });

    const renderExchangePreviewView = (props: Partial<ExchangePreviewViewProps> = {}) =>
        renderWithTradingProvider(
            <ExchangePreviewView
                quote={mercuryoFixedWorstQuote}
                txnErrorString={null}
                onSignTransactionNavigation={jest.fn()}
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
        expect(
            getByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeOnTheScreen();
        expect(getByText('ERROR_MESSAGE')).toBeOnTheScreen();
    });

    it('should render txnErrorString but no fee picker when isTxnError is true', () => {
        const { getByText, queryByText } = renderExchangePreviewView({
            txnErrorString: 'txnErrorString',
        });

        expect(getByText('BTC Account #1')).toBeOnTheScreen();
        expect(getByText('ETH Account #1')).toBeOnTheScreen();
        expect(getByText('txnErrorString')).toBeOnTheScreen();
        expect(
            queryByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeNull();
    });

    it('should render EIP-712 info with provider name when quote has EIP-712 sign data', () => {
        const { getByTestId } = renderExchangePreviewView({
            quote: oneInchFusionPlusWithEip712SignDataQuote,
        });

        expect(
            within(getByTestId('@trading/exchange-preview/eip712-info')).getByText('1inch Fusion+'),
        ).toBeOnTheScreen();
    });

    it('should not render transaction fee for quotes with EIP-712 sign data', () => {
        const { queryByText } = renderExchangePreviewView({
            quote: oneInchFusionPlusWithEip712SignDataQuote,
        });

        expect(
            queryByText(getTranslation('transactionManagement.fees.description.title.general')),
        ).toBeNull();
    });

    it('should not render EIP-712 info when quote has no EIP-712 sign data', () => {
        const { queryByTestId } = renderExchangePreviewView({
            quote: oneInchFusionPlusWithoutEip712SignDataQuote,
        });

        expect(queryByTestId('@trading/exchange-preview/eip712-info')).toBeNull();
    });

    it('should render KYC warning for provider with "KYC-required"', () => {
        const { getByText } = renderExchangePreviewView({
            quote: cexdirectFloatingQuote,
        });

        expect(getByText(getTranslation('moduleTrading.kyc.kycRequired'))).toBeOnTheScreen();
    });

    it('should not render KYC provider warning for providers with "noKYC"', () => {
        const { queryByText } = renderExchangePreviewView({
            quote: mercuryoFixedWorstQuote,
        });

        expect(queryByText(getTranslation('moduleTrading.kyc.kycRequired'))).toBeNull();
    });
});
