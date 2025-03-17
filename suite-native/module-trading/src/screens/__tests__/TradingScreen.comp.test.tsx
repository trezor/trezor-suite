import { renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { TradingScreen } from '../TradingScreen';

let mockUseTradingBuyDataValue: { isLoading: boolean; lastLoadedTimestamp: number };

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: 'TradingScreen' }),
}));

jest.mock('../../hooks/useTradingBuyData', () => ({
    useTradingBuyData: () => mockUseTradingBuyDataValue,
}));

describe('TradingScreen', () => {
    beforeEach(() => {
        mockUseTradingBuyDataValue = { isLoading: false, lastLoadedTimestamp: 0 };
    });

    const renderTradingScreen = () => renderWithStoreProviderAsync(<TradingScreen />);

    it('should render skeleton when isLoading is true', async () => {
        mockUseTradingBuyDataValue = { isLoading: true, lastLoadedTimestamp: 1 };

        const { getAllByText } = await renderTradingScreen();

        expect(getAllByText('Buy').length).toBe(1);
    });

    it('should render skeleton when lastLoadedTimestamp is 0', async () => {
        mockUseTradingBuyDataValue = { isLoading: false, lastLoadedTimestamp: 0 };

        const { getAllByText } = await renderTradingScreen();

        expect(getAllByText('Buy').length).toBe(1);
    });

    it('should render form when isLoading is false and lastLoadedTimestamp is greater than 0', async () => {
        mockUseTradingBuyDataValue = { isLoading: false, lastLoadedTimestamp: 1 };

        const { getAllByText } = await renderTradingScreen();

        expect(getAllByText('Buy').length).toBe(2);
    });
});
