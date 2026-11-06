import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { mockNetworkIcon, mockNetworksState } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { type TokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { HomeAssetIdentity } from './HomeAssetIdentity';
import { type MockSuiteState, mockInitialAppState } from '../../../../mocks/mockInitialAppState';

global.ResizeObserver = class MockedResizeObserver {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

const ETH = asNetworkSymbol('eth');

const USDC_ON_ETH = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' as TokenAddress;
const UNKNOWN_ON_ETH = '0x1111111111111111111111111111111111111111' as TokenAddress;

const state: MockSuiteState = {
    ...mockInitialAppState,
    networks: mockNetworksState([ETH]),
    tokenDefinitions: {
        [ETH]: {
            coin: { data: [USDC_ON_ETH], error: false, isLoading: false, hide: [], show: [] },
        },
    },
};

const renderIdentity = (contractAddress: TokenAddress) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState: state });

    renderWithProviders(
        { ...services, networks: { networkIcon: mockNetworkIcon() } },
        <HomeAssetIdentity symbol={ETH} contractAddress={contractAddress} displaySymbol="TKN" />,
    );
};

describe('the icon of a Home asset', () => {
    it('is fetched for a token in the definitions', () => {
        renderIdentity(USDC_ON_ETH);

        expect(screen.getByRole('img')).toHaveAttribute('src');
    });

    it('is not fetched for a token missing from the definitions, which shows a placeholder', () => {
        renderIdentity(UNKNOWN_ON_ETH);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});
