import { type ReactNode } from 'react';

import {
    ExperimentId,
    type MessageSystemState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { HomeScreen } from './HomeScreen';
import { type HomeScreenState } from './homescreenTypes';

const mockPortfolioAssetsContent = jest.fn(() => null);
const mockLegacyPortfolioContent = jest.fn(() => null);
const mockPortfolioAssetsNoNetworksConfigured = jest.fn(() => null);
const mockNoNetworksConfigured = jest.fn(() => null);
const mockSelectHomeScreenState = jest.fn((): HomeScreenState => 'portfolioContent');

type MockScreenProps = {
    children: ReactNode;
};

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useFocusEffect: () => undefined,
}));

jest.mock('@suite-common/wallet-core', () => ({
    selectBaseCurrency: () => 'usd',
    selectBitcoinAmountUnit: () => 0,
    selectIsDiscoveredDeviceAccountless: () => false,
}));

jest.mock('@suite-native/bluetooth', () => ({
    selectIsBluetoothDeviceOsUnpairingRequired: () => false,
    useBluetoothAlerts: () => ({ showSystemUnpairingAlert: () => undefined }),
}));

jest.mock('@suite-native/device-manager', () => ({
    DeviceManagerScreenHeader: () => null,
}));

jest.mock('@suite-native/navigation', () => ({
    Screen: ({ children }: MockScreenProps) => children,
}));

jest.mock('./components/EmptyPortfolioCrossroads', () => ({
    EmptyPortfolioCrossroads: () => null,
}));

jest.mock('./components/NoNetworksConfigured', () => ({
    NoNetworksConfigured: () => {
        mockNoNetworksConfigured();

        return null;
    },
}));

jest.mock('./components/PortfolioAssets/PortfolioAssetsNoNetworksConfigured', () => ({
    PortfolioAssetsNoNetworksConfigured: () => {
        mockPortfolioAssetsNoNetworksConfigured();

        return null;
    },
}));

jest.mock('./components/PortfolioAssets/PortfolioAssetsContent', () => ({
    PortfolioAssetsContent: () => {
        mockPortfolioAssetsContent();

        return null;
    },
}));

jest.mock('./components/PortfolioContent', () => ({
    PortfolioContent: () => {
        mockLegacyPortfolioContent();

        return null;
    },
}));

jest.mock('./homescreenSelectors', () => ({
    selectHomeScreenState: () => mockSelectHomeScreenState(),
}));

jest.mock('./useHomeRefreshControl', () => ({
    useHomeRefreshControl: () => undefined,
}));

jest.mock('./useShowAutoEjectAlert', () => ({
    useShowAutoEjectAlert: () => undefined,
}));

const createMessageSystemState = (activeVariant: 'A' | 'B'): MessageSystemState => ({
    ...messageSystemInitialState,
    config: {
        version: 1,
        timestamp: '2026-09-22',
        sequence: 1,
        actions: [],
        experiments: [
            {
                conditions: [],
                experiment: {
                    id: ExperimentId.assetFirstHomeTableMobile,
                    groups: [
                        { variant: 'A', percentage: activeVariant === 'A' ? 100 : 0 },
                        { variant: 'B', percentage: activeVariant === 'B' ? 100 : 0 },
                    ],
                },
            },
        ],
    },
    validExperiments: [ExperimentId.assetFirstHomeTableMobile],
});

describe('HomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockSelectHomeScreenState.mockReturnValue('portfolioContent');
    });

    it.each([
        {
            variant: 'A' as const,
            expectedContent: mockLegacyPortfolioContent,
            hiddenContent: mockPortfolioAssetsContent,
        },
        {
            variant: 'B' as const,
            expectedContent: mockPortfolioAssetsContent,
            hiddenContent: mockLegacyPortfolioContent,
        },
    ])(
        'renders the correct content for experiment variant $variant',
        async ({ variant, expectedContent, hiddenContent }) => {
            await renderWithStoreProvider(<HomeScreen />, {
                preloadedState: {
                    analytics: { instanceId: `home-screen-variant-${variant}-test` },
                    messageSystem: createMessageSystemState(variant),
                },
            });

            expect(expectedContent).toHaveBeenCalled();
            expect(hiddenContent).not.toHaveBeenCalled();
        },
    );

    it.each([
        {
            variant: 'A' as const,
            expectedContent: mockNoNetworksConfigured,
            hiddenContent: mockPortfolioAssetsNoNetworksConfigured,
        },
        {
            variant: 'B' as const,
            expectedContent: mockPortfolioAssetsNoNetworksConfigured,
            hiddenContent: mockNoNetworksConfigured,
        },
    ])(
        'renders the correct no networks content for experiment variant $variant',
        async ({ variant, expectedContent, hiddenContent }) => {
            mockSelectHomeScreenState.mockReturnValue('noNetworkConfigured');

            await renderWithStoreProvider(<HomeScreen />, {
                preloadedState: {
                    analytics: { instanceId: `home-screen-no-networks-${variant}-test` },
                    messageSystem: createMessageSystemState(variant),
                },
            });

            expect(expectedContent).toHaveBeenCalled();
            expect(hiddenContent).not.toHaveBeenCalled();
        },
    );
});
