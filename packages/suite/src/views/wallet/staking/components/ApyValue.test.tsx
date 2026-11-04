import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { EarnStakingRateTooltip } from 'src/components/earn/dashboard/staking/EarnStakingRateTooltip';
import { type AppState } from 'src/reducers/store';
import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { ApyValue } from './ApyValue';
import { mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

describe('ApyValue', () => {
    it.each([0, null, undefined])('distinguishes zero rewards from an unknown APY (%s)', apy => {
        const { services } = createTestCompositionRoot<void, AppState>({
            preloadedState: mockInitialAppState,
        });
        const { container } = renderWithProviders(services, <ApyValue apy={apy} />);

        if (apy === 0) {
            expect(container).toHaveTextContent('0%');
            expect(container).not.toHaveTextContent('~');
            expect(screen.queryByText(messages.TR_EARN_APY_N_A.defaultMessage)).toBeNull();
        } else {
            expect(screen.getByText(messages.TR_EARN_APY_N_A.defaultMessage)).toBeVisible();
        }
    });
});

it('shows a known zero APY in the Earn table instead of Not available', () => {
    const { services } = createTestCompositionRoot<void, AppState>({
        preloadedState: mockInitialAppState,
    });
    const { container } = renderWithProviders(
        services,
        <EarnStakingRateTooltip networkType="cardano" rate={0} />,
    );

    expect(container).toHaveTextContent('0%');
    expect(screen.queryByText(messages.TR_EARN_NOT_AVAILABLE.defaultMessage)).toBeNull();
});
