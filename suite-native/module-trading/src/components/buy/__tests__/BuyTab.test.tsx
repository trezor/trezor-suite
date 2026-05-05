import { act, screen, userEvent } from '@suite-native/test-utils-store';
import { selectIsTradingBuyEnabled } from '@suite-native/trading-state';

import {
    type PreloadedStatePartial,
    type TradingTestPreloadedState,
    renderWithTradingProvider,
} from '../../../__tests__/tradingTestUtils';
import { BuyTab } from '../BuyTab';

let mockUseTradingBuyData: jest.Mock;

jest.mock('../../../hooks/buy/useBuyData', () => ({
    useBuyData: (...params: unknown[]) => mockUseTradingBuyData(...params),
}));

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectIsTradingBuyEnabled: jest.fn(),
}));

jest.mock('../../concierge/ConciergeAlert', () => ({
    ConciergeAlert: () => null,
}));

describe('BuyTab', () => {
    beforeEach(() => {
        mockUseTradingBuyData = jest.fn(() => ({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        }));
        (selectIsTradingBuyEnabled as jest.Mock).mockReturnValue(true);
    });

    const renderBuyTab = (overrides?: PreloadedStatePartial<TradingTestPreloadedState>) =>
        renderWithTradingProvider(<BuyTab />, { overrides });

    const expectSkeleton = () => {
        expect(screen.getAllByTestId('BoxSkeleton').length).toBeGreaterThan(0);
    };

    const expectBuyForm = () => {
        expect(screen.getByText('You pay')).toBeTruthy();
    };

    const expectServerOffline = () => {
        expect(screen.getByText("It's not you, it's us.")).toBeTruthy();
    };

    it('should render Buy skeleton when isLoading is true', () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: true,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        renderBuyTab();

        expectSkeleton();
    });

    it('should render Buy skeleton when lastLoadedTimestamp is 0', () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 0,
            isFullyLoaded: false,
        });

        renderBuyTab();

        expectSkeleton();
    });

    it('should render Buy form when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded true', () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: true,
        });

        renderBuyTab();

        expectBuyForm();
    });

    it('should render server error info when isLoading is false, lastLoadedTimestamp is greater than 0 and isFullyLoaded false', () => {
        mockUseTradingBuyData.mockReturnValue({
            isLoading: false,
            lastLoadedTimestamp: 1,
            isFullyLoaded: false,
        });

        renderBuyTab();

        expectServerOffline();
    });

    it('should reload data when server error info is displayed and user presses "Try again" button', async () => {
        mockUseTradingBuyData
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

        const { getByText } = renderBuyTab();

        const reloadButton = getByText('Try again');

        await act(async () => {
            await userEvent.press(reloadButton);
        });

        expectBuyForm();
        expect(mockUseTradingBuyData).toHaveBeenCalledTimes(2);
        expect(mockUseTradingBuyData).toHaveBeenCalledWith(0);
        expect(mockUseTradingBuyData).toHaveBeenCalledWith(1);
    });

    it('should render disabled info when buy is disabled by FFs', () => {
        (selectIsTradingBuyEnabled as jest.Mock).mockReturnValue(false);
        const { getByText } = renderBuyTab();

        expect(getByText('Buy disabled')).toBeOnTheScreen();
    });
});
