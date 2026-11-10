import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { stakeInitialState } from '@suite-common/wallet-core';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type useStakingRate } from '@suite-native/earn';
import { getTranslation } from '@suite-native/intl';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { AssetDetailEarnSection } from './AssetDetailEarnSection';

const DEVICE_STATE = 'aliceWallet@device:0';
const VIEW_ALL_BUTTON = '@assets/asset-detail/earn-view-all-button';

const mockDispatchNavigation = mock<(action: unknown) => void>();
const mockUseStakingRate = mock<typeof useStakingRate>();
let mockRouteParams: AssetsStackParamList[AssetsStackRoutes.AssetDetail];

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: mockRouteParams }),
    useNavigation: () => ({ dispatch: mockDispatchNavigation }),
}));
jest.mock('@suite-native/earn', () => ({
    ...jest.requireActual('@suite-native/earn'),
    useStakingRate: (...args: Parameters<typeof useStakingRate>) => mockUseStakingRate(...args),
}));

type RenderEarnSectionParams = {
    networkSymbol: NetworkSymbol;
    formattedBalance: string;
    stakingRate?: number;
};

const renderEarnSection = ({
    networkSymbol,
    formattedBalance,
    stakingRate,
}: RenderEarnSectionParams) => {
    mockRouteParams = { networkSymbol };
    mockUseStakingRate.mockReturnValue({ rate: stakingRate ?? null });

    return renderWithStoreProvider(<AssetDetailEarnSection />, {
        preloadedState: {
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            wallet: {
                accounts: [
                    mockWalletAccount({
                        symbol: networkSymbol,
                        deviceState: DEVICE_STATE,
                        formattedBalance,
                    }),
                ],
                stake: stakeInitialState,
            },
        },
    });
};

describe('AssetDetailEarnSection', () => {
    it('shows a staking asset even when no staking rate is known', async () => {
        await renderEarnSection({ networkSymbol: asNetworkSymbol('eth'), formattedBalance: '1' });

        expect(screen.getByTestId(VIEW_ALL_BUTTON)).toBeTruthy();
        expect(
            screen.getByText(
                getTranslation('moduleAssets.assetDetailScreen.earnSection.available'),
            ),
        ).toBeTruthy();
        expect(
            screen.getByText(getTranslation('moduleAssets.assetDetailScreen.earnSection.staked')),
        ).toBeTruthy();
    });

    it('shows the current APY next to the staked amount', async () => {
        await renderEarnSection({
            networkSymbol: asNetworkSymbol('eth'),
            formattedBalance: '1',
            stakingRate: 3,
        });

        expect(screen.getByText(getTranslation('earn.apyPercentage', { apy: '3' }))).toBeTruthy();
    });

    it('names the Tron rate an APR', async () => {
        await renderEarnSection({
            networkSymbol: asNetworkSymbol('trx'),
            formattedBalance: '10',
            stakingRate: 4,
        });

        expect(screen.getByText(getTranslation('earn.aprPercentage', { apy: '4' }))).toBeTruthy();
    });

    it('labels the rest of a Cardano balance as unstaked', async () => {
        await renderEarnSection({ networkSymbol: asNetworkSymbol('ada'), formattedBalance: '10' });

        expect(
            screen.getByText(getTranslation('moduleAssets.assetDetailScreen.earnSection.unstaked')),
        ).toBeTruthy();
    });

    it('hides an asset with no balance', async () => {
        await renderEarnSection({ networkSymbol: asNetworkSymbol('eth'), formattedBalance: '0' });

        expect(screen.queryByTestId(VIEW_ALL_BUTTON)).toBeNull();
    });

    it('hides an asset that cannot be staked', async () => {
        await renderEarnSection({ networkSymbol: asNetworkSymbol('btc'), formattedBalance: '1' });

        expect(screen.queryByTestId(VIEW_ALL_BUTTON)).toBeNull();
    });
});
