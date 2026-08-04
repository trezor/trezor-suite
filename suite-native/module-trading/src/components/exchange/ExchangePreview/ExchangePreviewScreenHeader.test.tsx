import { getTranslation } from '@suite-native/intl';
import { oneInchFusionPlusWithoutEip712SignDataQuote } from '@suite-native/trading-fixtures';

import { ExchangePreviewScreenHeader } from './ExchangePreviewScreenHeader';
import { useDexExchangeTxSimulation } from '../../../hooks/exchange/useDexExchangeTxSimulation';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

jest.mock('../../../hooks/exchange/useDexExchangeTxSimulation', () => ({
    useDexExchangeTxSimulation: jest.fn(),
}));

const mockUseDexExchangeTxSimulation = jest.mocked(useDexExchangeTxSimulation);

const renderExchangePreviewScreenHeader = () =>
    renderWithTradingProvider(<ExchangePreviewScreenHeader />, { tradeType: 'exchange' });

describe('ExchangePreviewScreenHeader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: false,
            isLoading: false,
            error: null,
            data: undefined,
        });
    });

    it('renders only the exchange preview title when simulation is disabled', () => {
        const { getByText, queryByText } = renderExchangePreviewScreenHeader();

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.title')),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('moduleTrading.transactionSimulation.title'))).toBeNull();
    });

    it('renders the loading status while the simulation is loading', () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: true,
            error: null,
            data: undefined,
        });

        const { getByText } = renderExchangePreviewScreenHeader();

        expect(
            getByText(getTranslation('moduleTrading.transactionSimulation.simulating')),
        ).toBeOnTheScreen();
    });

    it('renders the simulation title after a successful simulation', () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: undefined,
        });

        const { getByText } = renderExchangePreviewScreenHeader();

        expect(
            getByText(getTranslation('moduleTrading.transactionSimulation.title')),
        ).toBeOnTheScreen();
    });

    it('renders only the exchange preview title when simulation fails', () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: new Error('Simulation failed'),
            data: undefined,
        });

        const { getByText, queryByText } = renderExchangePreviewScreenHeader();

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.title')),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('moduleTrading.transactionSimulation.title'))).toBeNull();
        expect(
            queryByText(getTranslation('moduleTrading.transactionSimulation.simulating')),
        ).toBeNull();
    });

    it('renders only the exchange preview title for a cross-chain trade', () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: undefined,
        });

        const { getByText, queryByText } = renderWithTradingProvider(
            <ExchangePreviewScreenHeader />,
            {
                tradeType: 'exchange',
                overrides: {
                    wallet: {
                        trading: {
                            exchange: {
                                selectedQuote: oneInchFusionPlusWithoutEip712SignDataQuote,
                            },
                        },
                    },
                },
            },
        );

        expect(
            getByText(getTranslation('moduleTrading.tradingExchangePreviewScreen.title')),
        ).toBeOnTheScreen();
        expect(queryByText(getTranslation('moduleTrading.transactionSimulation.title'))).toBeNull();
    });
});
