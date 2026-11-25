import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { initialMetadataState } from '@suite/metadata';
import { mockStakingQueryClient } from '@suite-common/earn-staking/mocks';
import { mockStakingProductInfo } from '@suite-common/earn-staking-common/mocks';
import { mockNetworksServices } from '@suite-common/networks/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { StakingPositionCard } from './StakingPositionCard';
import { type MockSuiteState } from '../../../../../mocks/mockInitialAppState';
import {
    ETH,
    createEarnStakingTableState,
    ethProduct,
    mockAccount,
    mockStakedPosition,
} from '../../dashboard/staking/earnStakingTableTestState';

const ethAccount = mockAccount({ symbol: ETH, descriptor: 'ETH' });
const position = mockStakedPosition(ethProduct.id, '2000000000000000000');

const renderCard = (rate?: number) => {
    const preloadedState = {
        ...createEarnStakingTableState({
            accounts: [ethAccount],
            positions: { [ethAccount.key]: [position] },
        }),
        metadata: initialMetadataState,
    };
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState });

    renderWithProviders(
        { ...services, networks: mockNetworksServices() },
        <StakingPositionCard
            position={position}
            descriptor={ethProduct}
            accountKey={ethAccount.key}
        />,
        {
            queryClient: mockStakingQueryClient({
                productInfo:
                    rate === undefined ? {} : { [ethProduct.id]: mockStakingProductInfo({ rate }) },
            }),
        },
    );
};

describe('StakingPositionCard', () => {
    it('shows no rate badge while the rate is loading', () => {
        renderCard();

        expect(screen.queryByText(/APY/)).not.toBeInTheDocument();
        expect(
            screen.queryByText(messages.TR_EARN_APY_NOT_AVAILABLE.defaultMessage),
        ).not.toBeInTheDocument();
    });

    it('shows the rate once it has loaded', () => {
        renderCard(3.4);

        expect(screen.getByText(/APY/)).toBeInTheDocument();
    });
});
