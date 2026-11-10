import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { type YieldDtoV2, useAllYieldOpportunities } from '@suite-common/earn-stablecoin-api';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { getWalletAssetKey } from '@suite-common/wallet-core';
import { mockYieldVault } from '@suite-common/wallet-core/mocks';
import { mockAccountToken, mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type StaticSessionId } from '@trezor/device-utils';
import { getWrappedNativeToken } from '@trezor/network-ethereum/constants';

import { AssetDetailYieldBanner } from './AssetDetailYieldBanner';
import { type MockSuiteState, mockInitialAppState } from '../../../../mocks/mockInitialAppState';
import { renderWithProviders } from '../../../support/test-utils/hooksHelper';

jest.mock('@suite-common/earn-stablecoin-api', () => ({
    ...jest.requireActual('@suite-common/earn-stablecoin-api'),
    useAllYieldOpportunities: jest.fn(),
}));

const mockUseAllYieldOpportunities = jest.mocked(useAllYieldOpportunities);

const DEVICE_STATE = '1stTestnetAddress@device_id:0' as StaticSessionId;

const ETH = asNetworkSymbol('eth');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;

const USDC_ASSET_KEY = getWalletAssetKey({
    deviceState: DEVICE_STATE,
    symbol: ETH,
    contractAddress: USDC_ON_ETH,
});
const ETH_ASSET_KEY = getWalletAssetKey({ deviceState: DEVICE_STATE, symbol: ETH });

const ethereumAccount = mockWalletAccount({
    symbol: ETH,
    formattedBalance: '2',
    tokens: [
        mockAccountToken({
            name: 'USD Coin',
            symbol: 'USDC',
            contract: USDC_ON_ETH,
            balance: '2400',
        }),
    ],
});

const getInitialState = ({ isBannerClosed = false } = {}): MockSuiteState => ({
    ...mockInitialAppState,
    networks: mockNetworksState([ETH]),
    device: {
        ...mockInitialAppState.device,
        selectedDevice: mockSuiteDevice({ state: { staticSessionId: DEVICE_STATE } }),
    },
    tokenDefinitions: {
        [ETH]: {
            coin: { data: [USDC_ON_ETH], error: false, isLoading: false, hide: [], show: [] },
        },
    },
    wallet: {
        ...mockInitialAppState.wallet,
        accounts: [ethereumAccount],
        settings: { ...mockInitialAppState.wallet.settings, enabledNetworks: [ETH] },
    },
    flags: {
        ...mockInitialAppState.flags,
        closedTokenYieldBanners: isBannerClosed ? { [`${ETH}-${USDC_ON_ETH}`]: true } : {},
    },
});

type MockVaultParams = {
    id: string;
    token: Pick<YieldDtoV2['token'], 'address' | 'symbol' | 'decimals'>;
    apy: number;
};

const mockVault = ({ id, token, apy }: MockVaultParams): YieldDtoV2 => {
    const vault = mockYieldVault();

    return mockYieldVault({
        id,
        token: { ...vault.token, ...token },
        rewardRate: { ...vault.rewardRate, total: apy / 100 },
    });
};

const wethVault = mockVault({ id: 'weth-vault', token: getWrappedNativeToken('eth'), apy: 4 });
const usdcVault = mockVault({
    id: 'usdc-vault',
    token: { address: USDC_ON_ETH, symbol: 'USDC', decimals: 6 },
    apy: 4.5,
});

const vaultsQuery = (vaults: YieldDtoV2[]) =>
    ({ data: vaults }) as ReturnType<typeof useAllYieldOpportunities>;

const renderBanner = (state: MockSuiteState, assetKey = USDC_ASSET_KEY) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState: state });

    renderWithProviders(services, <AssetDetailYieldBanner assetKey={assetKey} />);
};

describe('the yield banner on the asset screen', () => {
    beforeEach(() => {
        mockUseAllYieldOpportunities.mockReturnValue(vaultsQuery([wethVault, usdcVault]));
    });

    it('offers a token the rate of its vault', () => {
        renderBanner(getInitialState());

        const banner = screen.getByTestId('@asset-detail/yield-banner');

        expect(banner).toHaveTextContent('4.5');
        expect(banner).toHaveTextContent('USDC');
    });

    it('is left out for a token without a vault', () => {
        mockUseAllYieldOpportunities.mockReturnValue(vaultsQuery([wethVault]));

        renderBanner(getInitialState());

        expect(screen.queryByTestId('@asset-detail/yield-banner')).not.toBeInTheDocument();
    });

    it('is left out for a coin, which gets the staking banner instead', () => {
        renderBanner(getInitialState(), ETH_ASSET_KEY);

        expect(screen.queryByTestId('@asset-detail/yield-banner')).not.toBeInTheDocument();
    });

    it('stays away once dismissed', () => {
        renderBanner(getInitialState({ isBannerClosed: true }));

        expect(screen.queryByTestId('@asset-detail/yield-banner')).not.toBeInTheDocument();
    });
});
