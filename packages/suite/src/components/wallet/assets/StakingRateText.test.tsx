import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { StakingRateText } from './StakingRateText';
import { type MockSuiteState, mockInitialAppState } from '../../../../mocks/mockInitialAppState';

const renderRate = (symbol: string) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(
        services,
        <span data-testid="@rate">
            <StakingRateText networkSymbol={asNetworkSymbol(symbol)} apy={3.2} />
        </span>,
    );

    return screen.getByTestId('@rate').textContent;
};

describe(StakingRateText.name, () => {
    it('shows the rate of a network paying an APY as an APY', () => {
        expect(renderRate('eth')).toBe('3.2% APY');
    });

    it('shows the rate Tron pays as an APR, as its Earn modal does', () => {
        expect(renderRate('trx')).toBe('~3.2% APR');
    });
});
