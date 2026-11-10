import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { toTokenSymbol } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { EarnRewardsAmount } from './EarnRewardsAmount';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';
import { renderWithProviders } from '../../../../support/test-utils/hooksHelper';

const ethereum = asNetworkSymbol('eth');
const usdc = toTokenSymbol('USDC');

const renderRewards = (element: React.ReactElement) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({
        preloadedState: mockInitialAppState,
    });

    renderWithProviders(services, element);
};

const testId = '@earn/dashboard/rewards/amount';

describe('EarnRewardsAmount', () => {
    it('shows a stablecoin reward the way money is shown', () => {
        renderRewards(
            <EarnRewardsAmount
                symbol={usdc}
                rewards="4.24376469"
                apy={3.86}
                tokenDecimals={6}
                data-testid={testId}
            />,
        );

        expect(screen.getByTestId(testId)).toHaveTextContent('4.24 USDC');
    });

    it('hides a reward below the dust limit behind the limit itself', () => {
        renderRewards(
            <EarnRewardsAmount
                symbol={ethereum}
                rewards="0.00000574"
                apy={2.58}
                data-testid={testId}
            />,
        );

        expect(screen.getByTestId(testId)).toHaveTextContent('<0.00001 ETH');
    });

    it('keeps five decimals for a sub-unit reward of a coin', () => {
        renderRewards(
            <EarnRewardsAmount
                symbol={ethereum}
                rewards="0.123456789"
                apy={2.58}
                data-testid={testId}
            />,
        );

        expect(screen.getByTestId(testId)).toHaveTextContent('0.12345 ETH');
    });
});
