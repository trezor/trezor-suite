import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { createTestCompositionRoot } from '@suite-common/test-utils';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { renderWithProviders } from 'src/support/test-utils/hooksHelper';

import { HomeBalanceCard } from './HomeBalanceCard';
import { type MockSuiteState } from '../../../../mocks/mockInitialAppState';
import { ETH, getEthAssetState } from '../AssetDetail/assetDetailTestState';

const getInitialState = (isDiscreetModeActive: boolean): MockSuiteState => ({
    ...getEthAssetState({
        accounts: [mockWalletAccount({ symbol: ETH, formattedBalance: '2' })],
        ethRate: 3000,
        ethWeekAgoRate: 2500,
    }),
    discreetMode: { isActive: isDiscreetModeActive },
});

const renderBalanceCard = (state: MockSuiteState) => {
    const { services } = createTestCompositionRoot<void, MockSuiteState>({ preloadedState: state });

    renderWithProviders(services, <HomeBalanceCard />);
};

describe('the total balance on Home', () => {
    it('says what the wallet holds and how that moved over the week', () => {
        renderBalanceCard(getInitialState(false));

        expect(screen.getByTestId('@dashboard/home-asset/fiat-amount')).toHaveTextContent('$6,000');
        expect(screen.getByTestId('@dashboard/home-asset/week-change')).toHaveTextContent('$1,000');
    });

    it('hides the total and its change behind the discreet mode placeholder', () => {
        renderBalanceCard(getInitialState(true));

        const total = screen.getByTestId('@dashboard/home-asset/fiat-amount');
        const weekChange = screen.getByTestId('@dashboard/home-asset/week-change');

        expect(total).toHaveTextContent('$###');
        expect(total).not.toHaveTextContent('6,000');
        expect(weekChange).toHaveTextContent('$###');
        expect(weekChange).not.toHaveTextContent('1,000');
    });
});
