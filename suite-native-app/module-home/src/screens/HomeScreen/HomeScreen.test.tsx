import { type ReactNode } from 'react';

import {
    ExperimentId,
    type MessageSystemState,
    messageSystemInitialState,
} from '@suite-common/message-system';
import { renderWithStoreProvider } from '@suite-native/test-utils-store';

import { HomeScreen } from './HomeScreen';

const mockPortfolioAssetsContent = jest.fn(() => null);
const mockLegacyPortfolioContent = jest.fn(() => null);

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
    NoNetworksConfigured: () => null,
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
    selectHomeScreenState: () => 'portfolioContent',
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
                    id: ExperimentId.assetFirstHomeTable,
                    groups: [
                        { variant: 'A', percentage: activeVariant === 'A' ? 100 : 0 },
                        { variant: 'B', percentage: activeVariant === 'B' ? 100 : 0 },
                    ],
                },
            },
        ],
    },
    validExperiments: [ExperimentId.assetFirstHomeTable],
});

describe('HomeScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
});
