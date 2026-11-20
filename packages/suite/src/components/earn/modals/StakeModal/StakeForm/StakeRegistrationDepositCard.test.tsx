import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { type StakingPosition } from '@suite-common/earn-staking-common';

import {
    adaAccount,
    adaEverstakeProduct,
    amount,
    createStakingDashboardState,
    mockPosition,
    products,
    renderStakingDashboardComponent,
} from '#src/views/wallet/staking/components/stakingDashboardTestState';

import { StakeRegistrationDepositCard } from './StakeRegistrationDepositCard';

const DEPOSIT_AMOUNT = '@modal/staking/registration-deposit-amount-with-symbol';
const NEW_PROVIDER = '@modal/staking/new-provider';

const adaEverstakeProductWithDeposit = {
    ...adaEverstakeProduct,
    limits: { ...adaEverstakeProduct.limits, registrationDeposit: amount('2500000') },
};

const renderCard = (position?: StakingPosition) =>
    renderStakingDashboardComponent(<StakeRegistrationDepositCard account={adaAccount} />, {
        state: createStakingDashboardState({
            accounts: [adaAccount],
            descriptors: products.map(product =>
                product.id === adaEverstakeProduct.id ? adaEverstakeProductWithDeposit : product,
            ),
            positions: position === undefined ? {} : { [adaAccount.key]: [position] },
        }),
    });

describe('StakeRegistrationDepositCard', () => {
    it('shows the registration deposit of the product the network stakes on', () => {
        renderCard();

        expect(screen.getByTestId(DEPOSIT_AMOUNT)).toHaveTextContent('2.5 ADA');
        expect(screen.queryByTestId(NEW_PROVIDER)).not.toBeInTheDocument();
    });

    it('names the new provider instead of the deposit on a delegated key', () => {
        renderCard(
            mockPosition(adaEverstakeProduct.id, {
                lockup: 'liquid',
                balances: {
                    staked: amount('100000000'),
                    pending: amount('0'),
                    unstaking: amount('0'),
                    withdrawable: amount('0'),
                    rewards: amount('0'),
                },
                operations: ['unstake', 'claim', 'vote'],
            }),
        );

        expect(screen.getByTestId(NEW_PROVIDER)).toHaveTextContent('Everstake');
        expect(screen.queryByTestId(DEPOSIT_AMOUNT)).not.toBeInTheDocument();
    });
});
