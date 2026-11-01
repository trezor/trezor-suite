import { type RouteProp } from '@react-navigation/native';

import { mockNetworksServices } from '@suite-common/networks/mocks';
import {
    AppTabsRoutes,
    RootStackRoutes,
    type TradingFlowStackParamList,
    TradingFlowStackRoutes,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { fireEvent } from '@suite-native/test-utils-store';
import { btcAsset, usdcAsset } from '@suite-native/trading-fixtures';
import {
    selectBuyTradeableAssets,
    selectExchangeBuyTradeableAssets,
} from '@suite-native/trading-state';

import {
    TradingTradeableAssetScreen,
    type TradingTradeableAssetScreenProps,
} from './TradingTradeableAssetScreen';
import { renderWithTradingProvider } from '../test-utils/tradingTestUtils';

const mockBuyFilteredData = {
    filteredData: [btcAsset],
    filterValue: '',
    setFilterValue: jest.fn(),
    setFilterSymbol: jest.fn(),
    assetBalances: new Map(),
};
const mockExchangeFilteredData = {
    filteredData: [usdcAsset],
    filterValue: '',
    setFilterValue: jest.fn(),
    setFilterSymbol: jest.fn(),
    assetBalances: new Map(),
};
const mockUseTradingTradeableAssetsFilteredData = jest.fn();

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: TradingFlowStackRoutes.TradingTradeableAsset }),
}));

jest.mock('../hooks/general/useTradingTradeableAssetsFilteredData', () => ({
    useTradingTradeableAssetsFilteredData: (...args: unknown[]) =>
        mockUseTradingTradeableAssetsFilteredData(...args),
}));

const createRoute = (
    tradingType: 'buy' | 'exchange',
): RouteProp<TradingFlowStackParamList, TradingFlowStackRoutes.TradingTradeableAsset> => ({
    key: TradingFlowStackRoutes.TradingTradeableAsset,
    name: TradingFlowStackRoutes.TradingTradeableAsset,
    params: { tradingType },
});

describe('TradingTradeableAssetScreen', () => {
    const navigation = {
        popTo: jest.fn(),
    } as unknown as TradingTradeableAssetScreenProps['navigation'];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        ['buy', 'BTC', btcAsset.cryptoId],
        ['exchange', 'USDC', usdcAsset.cryptoId],
    ] as const)(
        'renders and selects the %s asset data',
        async (tradingType, assetSymbol, cryptoId) => {
            mockUseTradingTradeableAssetsFilteredData.mockReturnValue(
                tradingType === 'buy' ? mockBuyFilteredData : mockExchangeFilteredData,
            );

            const { getByLabelText, getByText } = await renderWithTradingProvider(
                <TradingTradeableAssetScreen
                    navigation={navigation}
                    route={createRoute(tradingType)}
                />,
                {
                    services: {
                        networks: mockNetworksServices(),
                    },
                },
            );

            const assetElement =
                tradingType === 'buy' ? getByText(assetSymbol) : getByLabelText(assetSymbol);
            await fireEvent.press(assetElement);

            expect(mockUseTradingTradeableAssetsFilteredData).toHaveBeenCalledWith(
                tradingType === 'buy' ? selectBuyTradeableAssets : selectExchangeBuyTradeableAssets,
            );

            expect(navigation.popTo).toHaveBeenCalledWith(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.TradeStack,
                params: {
                    screen: TradingStackRoutes.Trading,
                    params: {
                        tradingType,
                        selectedTradeableAssetCryptoId: cryptoId,
                    },
                },
            });
        },
    );
});
