import {
    PreloadedState,
    act,
    renderWithStoreProviderAsync,
    screen,
    userEvent,
} from '@suite-native/test-utils';

import { ExchangeTabContent } from '../ExchangeTabContent';

let mockUseTradingExchangeData: jest.Mock;

jest.mock('../../../hooks/exchange/useExchangeData', () => ({
    useExchangeData: (...params: unknown[]) => mockUseTradingExchangeData(...params),
}));

jest.mock('../../../selectors/commonSelectors', () => ({
    ...jest.requireActual('../../../selectors/commonSelectors'),
    selectIsTradingExchangeEnabled: () => true,
}));

describe('ExchangeTab', () => {
    beforeEach(() => {
        mockUseTradingExchangeData = jest.fn(() => ({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        }));
    });

    const renderExchangeTab = (preloadedState?: PreloadedState) =>
        renderWithStoreProviderAsync(<ExchangeTabContent />, { preloadedState });

    const expectSkeleton = () => {
        expect(screen.getAllByTestId('BoxSkeleton').length).toBeGreaterThan(0);
    };

    const expectExchangeForm = () => {
        expect(screen.getByText('You pay')).toBeOnTheScreen();
        expect(screen.getByText('You get')).toBeOnTheScreen();
    };

    const expectServerOffline = () => {
        expect(screen.getByText("It's not you, it's us.")).toBeOnTheScreen();
    };

    it('should render Exchange skeleton when isLoading is true', async () => {
        mockUseTradingExchangeData.mockReturnValue({
            isLoading: true,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        await renderExchangeTab();

        expectSkeleton();
    });

    it('should render Exchange skeleton when lastLoadedTimestamp is 0', async () => {
        mockUseTradingExchangeData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        });

        await renderExchangeTab();

        expectSkeleton();
    });

    it('should render Exchange form when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded true', async () => {
        mockUseTradingExchangeData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: true,
        });

        await renderExchangeTab();

        expectExchangeForm();
    });

    it('should render server error info when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded false', async () => {
        mockUseTradingExchangeData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        await renderExchangeTab();

        expectServerOffline();
    });

    it('should reload data when server error info is displayed and user presses "Try again" button', async () => {
        mockUseTradingExchangeData
            .mockReturnValueOnce({
                isLoading: false,
                lastLoadedTimestamp: 1,
                isFullyLoaded: false,
            })
            .mockReturnValue({
                isLoading: false,
                lastLoadedTimestamp: 1,
                isFullyLoaded: true,
            });

        const { getByText } = await renderExchangeTab();

        const reloadButton = getByText('Try again');

        await act(async () => {
            await userEvent.press(reloadButton);
        });

        expectExchangeForm();
        expect(mockUseTradingExchangeData).toHaveBeenCalledTimes(2);
        expect(mockUseTradingExchangeData).toHaveBeenCalledWith(0);
        expect(mockUseTradingExchangeData).toHaveBeenCalledWith(1);
    });
});
