import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { createTestCompositionRoot } from '@suite-common/test-utils';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { StakingRateText } from './StakingRateText';
import { type MockSuiteState, mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const renderRate = (rate: number | null, rateKind: StakingRateKind) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(
        services,
        <span data-testid="@rate">
            <StakingRateText rate={rate} rateKind={rateKind} />
        </span>,
    );

    return screen.getByTestId('@rate').textContent;
};

describe(StakingRateText.name, () => {
    it('shows the rate of a product paying an APY as an APY', () => {
        expect(renderRate(3.2, 'apy')).toBe('3.2% APY');
    });

    it('shows the rate of a product paying an APR as an APR, as the Tron Earn modal does', () => {
        expect(renderRate(3.2, 'apr')).toBe('~3.2% APR');
    });

    it('says a product without a rate, a testnet, has none', () => {
        expect(renderRate(null, 'apy')).toBe(messages.TR_EARN_APY_NOT_AVAILABLE.defaultMessage);
    });
});
