import {
    type PreloadedState,
    act,
    renderWithStoreProvider,
    screen,
    userEvent,
} from '@suite-native/test-utils';

import { SellTabContent } from '../SellTabContent';

let mockUseSellData: jest.Mock;

jest.mock('../../../hooks/sell/useSellData', () => ({
    useSellData: (...params: unknown[]) => mockUseSellData(...params),
}));
jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingSellEnabled: () => true,
}));

describe('SellTabContent', () => {
    beforeEach(() => {
        mockUseSellData = jest.fn(() => ({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        }));
    });

    const renderSellTabContent = (preloadedState?: PreloadedState) =>
        renderWithStoreProvider(<SellTabContent />, { preloadedState });

    const expectSkeleton = () => {
        expect(screen.getAllByTestId('BoxSkeleton').length).toBeGreaterThan(0);
    };

    const expectSellForm = () => {
        expect(screen.getByText('You pay')).toBeOnTheScreen();
    };

    const expectServerOffline = () => {
        expect(screen.getByText("It's not you, it's us.")).toBeOnTheScreen();
    };

    it('should render Sell skeleton when isLoading is true', () => {
        mockUseSellData.mockReturnValue({
            isLoading: true,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        renderSellTabContent();

        expectSkeleton();
    });

    it('should render Sell skeleton when lastLoadedTimestamp is 0', () => {
        mockUseSellData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        });

        renderSellTabContent();

        expectSkeleton();
    });

    it('should render Sell form when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded true', () => {
        mockUseSellData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: true,
        });

        renderSellTabContent();

        expectSellForm();
    });

    it('should render server error info when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded false', () => {
        mockUseSellData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        renderSellTabContent();

        expectServerOffline();
    });

    it('should reload data when server error info is displayed and user presses "Try again" button', async () => {
        mockUseSellData
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

        const { getByText } = renderSellTabContent();

        const reloadButton = getByText('Try again');

        await act(async () => {
            await userEvent.press(reloadButton);
        });

        expectSellForm();
        expect(mockUseSellData).toHaveBeenCalledTimes(2);
        expect(mockUseSellData).toHaveBeenCalledWith(0);
        expect(mockUseSellData).toHaveBeenCalledWith(1);
    });
});
