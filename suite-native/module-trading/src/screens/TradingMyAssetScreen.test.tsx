import { type RouteProp } from '@react-navigation/native';
import type { CryptoId } from 'invity-api';

import { asBaseCurrencyAmount } from '@suite-common/wallet-types';
import {
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    TradingStackRoutes,
} from '@suite-native/navigation';
import { fireEvent } from '@suite-native/test-utils-store';
import { btc1NormalAccount } from '@suite-native/trading-fixtures';
import { selectAccountsWithTokensToSellSectionListByTradingType } from '@suite-native/trading-state';
import { type MyAsset } from '@suite-native/trading-types';
import { BigNumber } from '@trezor/utils';

import { TradingMyAssetScreen, type TradingMyAssetScreenProps } from './TradingMyAssetScreen';
import { renderWithTradingProvider } from '../test-utils/tradingTestUtils';

const bitcoinAsset: MyAsset = {
    name: 'Bitcoin',
    symbol: 'btc',
    cryptoId: 'bitcoin' as CryptoId,
    balance: '1.23',
    fiatBalance: asBaseCurrencyAmount(new BigNumber('45000')),
    isEnabled: true,
};

const sections = [
    {
        key: 'btc-section',
        label: 'Bitcoin #1',
        sectionData: btc1NormalAccount,
        data: [bitcoinAsset],
    },
];

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ name: RootStackRoutes.TradingMyAsset }),
}));

jest.mock('@suite-native/trading-state', () => ({
    ...jest.requireActual('@suite-native/trading-state'),
    selectAccountsWithTokensToSellSectionListByTradingType: jest.fn(),
}));

jest.mock('@suite-common/trading', () => ({
    ...jest.requireActual('@suite-common/trading'),
    usePreferredCurrencyUsdThreshold: () => asBaseCurrencyAmount(new BigNumber('0.1')),
}));

const createRoute = (
    tradingType: 'sell' | 'exchange',
): RouteProp<RootStackParamList, RootStackRoutes.TradingMyAsset> => ({
    key: RootStackRoutes.TradingMyAsset,
    name: RootStackRoutes.TradingMyAsset,
    params: { tradingType },
});

describe('TradingMyAssetScreen', () => {
    const navigation = {
        popTo: jest.fn(),
    } as unknown as TradingMyAssetScreenProps['navigation'];

    beforeEach(() => {
        jest.clearAllMocks();
        jest.mocked(selectAccountsWithTokensToSellSectionListByTradingType).mockReturnValue(
            sections,
        );
    });

    it.each(['sell', 'exchange'] as const)(
        'returns the selected asset and account to the %s form',
        async tradingType => {
            const { getByText } = await renderWithTradingProvider(
                <TradingMyAssetScreen navigation={navigation} route={createRoute(tradingType)} />,
            );

            await fireEvent.press(getByText('BTC'));

            expect(selectAccountsWithTokensToSellSectionListByTradingType).toHaveBeenCalledWith(
                expect.anything(),
                tradingType,
            );
            expect(navigation.popTo).toHaveBeenCalledWith(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.TradeStack,
                params: {
                    screen: TradingStackRoutes.Trading,
                    params: {
                        tradingType,
                        selectedMyAssetAccountKey: btc1NormalAccount.key,
                        selectedMyAssetCryptoId: bitcoinAsset.cryptoId,
                    },
                },
            });
        },
    );
});
