import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { EarnStakingRateTooltip } from '#src/components/earn/dashboard/staking/EarnStakingRateTooltip';
import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { ApyValue } from './ApyValue';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

describe('ApyValue', () => {
    it.each([0, null, undefined])('shows unavailable APY by default (%s)', apy => {
        const { services } = createTestCompositionRoot<void, MockSuiteState>({
            preloadedState: mockInitialAppState,
        });
        renderWithProviders(services, <ApyValue apy={apy} />);

        expect(screen.getByText(messages.TR_EARN_APY_N_A.defaultMessage)).toBeVisible();
    });

    it('shows an explicitly known zero without an approximation', () => {
        const { services } = createTestCompositionRoot<void, MockSuiteState>({
            preloadedState: mockInitialAppState,
        });
        const { container } = renderWithProviders(services, <ApyValue apy={0} showZero />);
        expect(container).toHaveTextContent('0%');
        expect(container).not.toHaveTextContent('~');
        expect(screen.queryByText(messages.TR_EARN_APY_N_A.defaultMessage)).toBeNull();
    });
});

it('shows a known zero APY in the Earn table instead of Not available', () => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: mockInitialAppState,
    });
    const { container } = renderWithProviders(
        services,
        <EarnStakingRateTooltip networkType="cardano" rate={0} />,
    );

    expect(container).toHaveTextContent('0%');
    expect(screen.queryByText(messages.TR_EARN_NOT_AVAILABLE.defaultMessage)).toBeNull();
});
