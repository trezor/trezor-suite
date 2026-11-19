import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { TokenMetadataProvider } from '@suite-common/token';
import { toTokenAddress } from '@suite-common/tokens';
import { asNetworkSymbol } from '@suite-common/wallet-config';

import { renderWithProviders } from '#src/support/test-utils/hooksHelper';

import { EarnRewardsAmount } from './EarnRewardsAmount';
import { type MockSuiteState, mockInitialAppState } from '../../../../../mocks/mockInitialAppState';

const ethereum = asNetworkSymbol('eth');
const usdc = toTokenAddress('0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48');

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
            <TokenMetadataProvider
                sources={[
                    {
                        networkSymbol: ethereum,
                        tokens: [{ contract: usdc, symbol: 'USDC', decimals: 6 }],
                    },
                ]}
            >
                <EarnRewardsAmount
                    symbol={ethereum}
                    contractAddress={usdc}
                    rewards="4.24376469"
                    apy={3.86}
                    data-testid={testId}
                />
            </TokenMetadataProvider>,
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
