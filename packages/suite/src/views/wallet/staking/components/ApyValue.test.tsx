import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { EarnStakingRateTooltip } from '#src/components/earn/dashboard/staking/EarnStakingRateTooltip';
import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

it('shows No rewards in the Earn table for a registered Cardano account without a pool', () => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: mockInitialAppState,
    });
    const { container } = renderWithProviders(
        services,
        <EarnStakingRateTooltip networkType="cardano" rate={0} hasNoPool />,
    );

    expect(screen.getByText(messages.TR_STAKING_REWARDS_REDUCED.defaultMessage)).toBeVisible();
    expect(container).not.toHaveTextContent('0%');
    expect(screen.queryByText(messages.TR_EARN_NOT_AVAILABLE.defaultMessage)).toBeNull();
});
