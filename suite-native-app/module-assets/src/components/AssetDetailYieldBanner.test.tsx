import { type useYieldVaultApy } from '@suite-common/earn-stablecoin';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { bannerFlagsInitialState, setIsTokenYieldBannerClosed } from '@suite-native/banners';
import { getTranslation } from '@suite-native/intl';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';
import {
    createStoreFromPreloadedState,
    fireEvent,
    renderWithStoreProvider,
    screen,
} from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { AssetDetailYieldBanner } from './AssetDetailYieldBanner';

const DEVICE_STATE = 'aliceWallet@device:0';
const ETH = asNetworkSymbol('eth');
const USDC_CONTRACT = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

const mockDispatchNavigation = mock<(action: unknown) => void>();
const mockUseYieldVaultApy = mock<typeof useYieldVaultApy>();
let mockRouteParams: AssetsStackParamList[AssetsStackRoutes.AssetDetail];

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: mockRouteParams }),
    useNavigation: () => ({ dispatch: mockDispatchNavigation }),
}));
jest.mock('@suite-common/earn-stablecoin', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin'),
    useYieldVaultApy: (...args: Parameters<typeof useYieldVaultApy>) =>
        mockUseYieldVaultApy(...args),
}));

const ethereumAccount: Account = mockWalletAccount({
    symbol: ETH,
    deviceState: DEVICE_STATE,
    tokens: [
        mockAccountToken({
            contract: USDC_CONTRACT,
            symbol: 'USDC',
            decimals: 6,
            balance: '720',
        }),
    ],
});

const USDC_BANNER_KEY = `${ETH}-${USDC_CONTRACT}`;

type RenderYieldBannerParams = {
    tokenContract?: TokenAddress;
    closedTokenYieldBannerKeys?: string[];
};

const renderYieldBanner = async ({
    tokenContract,
    closedTokenYieldBannerKeys = [],
}: RenderYieldBannerParams = {}) => {
    mockRouteParams = { networkSymbol: ETH, tokenContract };

    const store = createStoreFromPreloadedState({
        device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
        wallet: { accounts: [ethereumAccount] },
        tokenDefinitions: {
            [ETH]: { coin: { data: [USDC_CONTRACT], hide: [], show: [] } },
        },
        bannerFlags: { ...bannerFlagsInitialState, closedTokenYieldBannerKeys },
    });
    const dispatchSpy = jest.spyOn(store, 'dispatch');
    const analyticsServices: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };

    await renderWithStoreProvider(<AssetDetailYieldBanner />, {
        services: { store, ...analyticsServices },
    });

    return { ...analyticsServices, dispatchSpy };
};

const BANNER = '@asset-detail/yield-banner';
const exploreButtonLabel = getTranslation('earn.promoStakeBanner.exploreButton');

describe('AssetDetailYieldBanner', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseYieldVaultApy.mockReturnValue(4.5);
    });

    it('offers a token the rate of its vault', async () => {
        await renderYieldBanner({ tokenContract: USDC_CONTRACT });

        expect(
            screen.getByText(
                getTranslation('earn.promoStakeBanner.title', { apy: '4.5', symbol: 'USDC' }),
            ),
        ).toBeTruthy();
        expect(
            screen.getByText(
                getTranslation('moduleAssets.assetDetailScreen.yieldBanner.description', {
                    symbol: 'USDC',
                }),
            ),
        ).toBeTruthy();
    });

    it('is left out for a token without a vault', async () => {
        mockUseYieldVaultApy.mockReturnValue(null);

        await renderYieldBanner({ tokenContract: USDC_CONTRACT });

        expect(screen.queryByTestId(BANNER)).toBeNull();
    });

    it('is left out for a coin, which gets the staking banner instead', async () => {
        await renderYieldBanner();

        expect(screen.queryByTestId(BANNER)).toBeNull();
    });

    it('opens Earn from the explore button', async () => {
        const { analytics } = await renderYieldBanner({ tokenContract: USDC_CONTRACT });

        fireEvent.press(screen.getByText(exploreButtonLabel));

        expect(mockDispatchNavigation).toHaveBeenCalledTimes(1);
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/navigate',
            payload: {
                action: 'continue',
                from: 'asset-detail-banner',
                to: 'earn-dashboard',
                networkSymbol: ETH,
            },
        });
    });

    it('stays away once dismissed', async () => {
        await renderYieldBanner({
            tokenContract: USDC_CONTRACT,
            closedTokenYieldBannerKeys: [USDC_BANNER_KEY],
        });

        expect(screen.queryByTestId(BANNER)).toBeNull();
    });

    it('is dismissed for its token only', async () => {
        const { analytics, dispatchSpy } = await renderYieldBanner({
            tokenContract: USDC_CONTRACT,
        });

        fireEvent.press(screen.getByTestId('@earn/promo-banner/close'));

        expect(dispatchSpy).toHaveBeenCalledWith(setIsTokenYieldBannerClosed(USDC_BANNER_KEY));
        expect(mockDispatchNavigation).not.toHaveBeenCalled();
        expect(analytics.report).toHaveBeenCalledWith({
            type: 'yield/navigate',
            payload: {
                action: 'cancel',
                from: 'asset-detail-banner',
                to: 'earn-dashboard',
                networkSymbol: ETH,
            },
        });
    });
});
