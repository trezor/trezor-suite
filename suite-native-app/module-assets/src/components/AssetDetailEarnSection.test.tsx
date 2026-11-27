import { type useNetworkStakingRate } from '@suite-common/earn-staking';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingProviderIdSchema } from '@suite-common/earn-staking-common';
import { mockStakingProductDescriptor } from '@suite-common/earn-staking-common/mocks';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { getTranslation } from '@suite-native/intl';
import { type AssetsStackParamList, type AssetsStackRoutes } from '@suite-native/navigation';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';
import { mock } from '@trezor/dependency-injection';

import { AssetDetailEarnSection } from './AssetDetailEarnSection';

const DEVICE_STATE = 'aliceWallet@device:0';
const VIEW_ALL_BUTTON = '@assets/asset-detail/earn-view-all-button';

// The staking products of the networks under test; bitcoin has none.
const stakingProducts = [
    mockStakingProductDescriptor(),
    mockStakingProductDescriptor({
        networkSymbol: asNetworkSymbol('ada'),
        type: 'native',
        operations: ['stake', 'unstake', 'claim', 'vote'],
    }),
    mockStakingProductDescriptor({
        networkSymbol: asNetworkSymbol('trx'),
        providerId: stakingProviderIdSchema.parse('curated'),
        type: 'native',
        operations: ['stake', 'unstake', 'withdraw', 'claim', 'vote'],
        rateKind: 'apr',
        rewardsKind: 'claimable',
        platforms: { desktop: { access: 'manage' }, mobile: { access: 'read-only' } },
    }),
];

const mockDispatchNavigation = mock<(action: unknown) => void>();
const mockUseNetworkStakingRate = mock<typeof useNetworkStakingRate>();
let mockRouteParams: AssetsStackParamList[AssetsStackRoutes.AssetDetail];

jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useRoute: () => ({ params: mockRouteParams }),
    useNavigation: () => ({ dispatch: mockDispatchNavigation }),
}));
jest.mock('@suite-common/earn-staking', () => ({
    ...jest.requireActual('@suite-common/earn-staking'),
    useNetworkStakingRate: (...args: Parameters<typeof useNetworkStakingRate>) =>
        mockUseNetworkStakingRate(...args),
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
    mockUseNetworkStakingRate.mockImplementation(params => ({
        rate: stakingRate ?? null,
        rateKind: params.networkSymbol === asNetworkSymbol('trx') ? 'apr' : 'apy',
        isPending: false,
    }));

    return renderWithStoreProvider(<AssetDetailEarnSection />, {
        preloadedState: {
            device: { selectedDevice: { state: { staticSessionId: DEVICE_STATE } } },
            networks: mockNetworksState([networkSymbol]),
            earn: {
                staking: mockStakingState({ platform: 'mobile', descriptors: stakingProducts }),
            },
            wallet: {
                accounts: [
                    mockWalletAccount({
                        symbol: networkSymbol,
                        deviceState: DEVICE_STATE,
                        formattedBalance,
                    }),
                ],
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
