import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { type StakingProductInfo } from '@suite-common/earn-staking-common';
import { mockStakingProductInfo } from '@suite-common/earn-staking-common/mocks';

import { PayoutCardFrequencyRewards } from './PayoutCardFrequencyRewards';
import {
    createStakingDashboardState,
    renderStakingDashboardComponent,
    solProduct,
} from '../../stakingDashboardTestState';

const DAYS = '@staking/payout-card/days';

const renderCard = (productInfo?: StakingProductInfo) =>
    renderStakingDashboardComponent(<PayoutCardFrequencyRewards productId={solProduct.id} />, {
        state: createStakingDashboardState(),
        productInfo: productInfo === undefined ? {} : { [solProduct.id]: productInfo },
    });

describe('PayoutCardFrequencyRewards', () => {
    it('shows a skeleton until the product info is cached', () => {
        const { container } = renderCard();

        expect(container.querySelector('[data-component="Skeleton"]')).not.toBeNull();
        expect(screen.queryByTestId(DAYS)).not.toBeInTheDocument();
    });

    it('shows the reward period of the cached product info', () => {
        renderCard(mockStakingProductInfo({ rewardPeriodDays: 3 }));

        expect(screen.getByTestId(DAYS)).toHaveTextContent('3 days');
    });

    it('says N/A once the product info is cached without a reward period', () => {
        const { container } = renderCard(mockStakingProductInfo({ rewardPeriodDays: null }));

        expect(container.querySelector('[data-component="Skeleton"]')).toBeNull();
        expect(screen.getByTestId(DAYS)).toHaveTextContent('N/A');
    });
});
