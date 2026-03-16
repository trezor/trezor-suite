import { FeatureFlag } from '@suite-native/feature-flags';
import { type PreloadedState, act, renderWithStoreProviderAsync } from '@suite-native/test-utils';

import { SellTab } from '../SellTab';

let mockIsDeviceInViewOnlyMode = false;
let mockIsPortfolioTrackerDevice = false;

jest.mock('@suite-common/device', () => ({
    ...jest.requireActual('@suite-common/device'),
    selectIsDeviceInViewOnlyMode: () => mockIsDeviceInViewOnlyMode,
    selectIsPortfolioTrackerDevice: () => mockIsPortfolioTrackerDevice,
}));

jest.mock('../../../hooks/sell/useSellData', () => ({
    useSellData: () => ({
        isLoading: false,
        lastLoadedTimestamp: 1,
        isFullyLoaded: true,
    }),
}));

describe('SellTab', () => {
    const renderSellTab = async (preloadedState: PreloadedState = {}) => {
        const result = await renderWithStoreProviderAsync(<SellTab />, { preloadedState });

        // wait for form reactions to run
        await act(() => Promise.resolve());

        return result;
    };

    beforeEach(() => {
        mockIsDeviceInViewOnlyMode = false;
        mockIsPortfolioTrackerDevice = false;
    });

    it('should render disabled info when sell FF is not enabled', async () => {
        const { getByText } = await renderSellTab({
            featureFlags: {
                [FeatureFlag.IsTradingSellEnabled]: false,
            },
            messageSystem: {
                validMessages: {
                    feature: ['actionId'],
                    banner: [],
                    context: [],
                    modal: [],
                },
                dismissedMessages: [],
                config: {
                    actions: [
                        {
                            message: {
                                id: 'actionId',
                                category: ['feature'],
                                feature: [
                                    {
                                        domain: 'trading.sell',
                                        flag: false,
                                    },
                                ],
                            },
                        },
                    ],
                },
            },
        } as unknown as PreloadedState);

        expect(getByText('Sell disabled')).toBeOnTheScreen();
    });

    it('should display Portfolio Tracker info with Portfolio Tracker "wallet" selected', async () => {
        // Portfolio Tracker sets both selectors to true
        mockIsPortfolioTrackerDevice = true;
        mockIsDeviceInViewOnlyMode = true;
        const { getByText, queryByText } = await renderSellTab({
            featureFlags: {
                [FeatureFlag.IsTradingSellEnabled]: true,
            },
        });

        expect(getByText('Portfolio Tracker')).toBeOnTheScreen();
        expect(queryByText('View-only wallet')).toBeNull();
    });

    it('should display form even with view-only wallet', async () => {
        mockIsDeviceInViewOnlyMode = true;
        const { getByText } = await renderSellTab({
            featureFlags: {
                [FeatureFlag.IsTradingSellEnabled]: true,
            },
        });

        expect(getByText('Select asset')).toBeOnTheScreen();
    });

    it('should display form otherwise', async () => {
        const { getByText } = await renderSellTab({
            featureFlags: {
                [FeatureFlag.IsTradingSellEnabled]: true,
            },
        });

        expect(getByText('Select asset')).toBeOnTheScreen();
    });
});
