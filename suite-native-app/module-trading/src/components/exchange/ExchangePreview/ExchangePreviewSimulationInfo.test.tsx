import { getTranslation } from '@suite-native/intl';
import { oneInchFusionPlusWithoutEip712SignDataQuote } from '@suite-native/trading-fixtures';

import { ExchangePreviewSimulationInfo } from './ExchangePreviewSimulationInfo';
import { useDexExchangeTxSimulation } from '../../../hooks/exchange/useDexExchangeTxSimulation';
import { renderWithTradingProvider } from '../../../test-utils/tradingTestUtils';

jest.mock('../../../hooks/exchange/useDexExchangeTxSimulation', () => ({
    useDexExchangeTxSimulation: jest.fn(),
}));

const mockUseDexExchangeTxSimulation = jest.mocked(useDexExchangeTxSimulation);

const SIMULATION_TITLE = getTranslation('moduleTrading.transactionSimulation.title');
const SIMULATING = getTranslation('moduleTrading.transactionSimulation.simulating');

const renderExchangePreviewSimulationInfo = () =>
    renderWithTradingProvider(<ExchangePreviewSimulationInfo />, { tradeType: 'exchange' });

describe('ExchangePreviewSimulationInfo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: false,
            isLoading: false,
            error: null,
            data: undefined,
        });
    });

    it('renders nothing when simulation is disabled', async () => {
        const { queryByText } = await renderExchangePreviewSimulationInfo();

        expect(queryByText(SIMULATION_TITLE)).toBeNull();
        expect(queryByText(SIMULATING)).toBeNull();
    });

    it('renders the loading status while the simulation is loading', async () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: true,
            error: null,
            data: undefined,
        });

        const { getByText } = await renderExchangePreviewSimulationInfo();

        expect(getByText(SIMULATING)).toBeOnTheScreen();
    });

    it('renders the simulation title after a successful simulation', async () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: undefined,
        });

        const { getByText } = await renderExchangePreviewSimulationInfo();

        expect(getByText(SIMULATION_TITLE)).toBeOnTheScreen();
    });

    it('renders nothing when simulation fails', async () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: new Error('Simulation failed'),
            data: undefined,
        });

        const { queryByText } = await renderExchangePreviewSimulationInfo();

        expect(queryByText(SIMULATION_TITLE)).toBeNull();
        expect(queryByText(SIMULATING)).toBeNull();
    });

    it('renders nothing for a cross-chain trade', async () => {
        mockUseDexExchangeTxSimulation.mockReturnValue({
            isEnabled: true,
            isLoading: false,
            error: null,
            data: undefined,
        });

        const { queryByText } = await renderWithTradingProvider(<ExchangePreviewSimulationInfo />, {
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
        });

        expect(queryByText(SIMULATION_TITLE)).toBeNull();
    });
});
