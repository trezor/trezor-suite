import '@suite-common/test-utils/globalOverrides';

import { screen } from '@testing-library/react';

import { messages } from '@suite/intl';
import { type StakingProductDescriptor } from '@suite-common/earn-staking-common';

import { NewProviderCard } from './NewProviderCard';
import {
    adaAccount,
    adaExternalProduct,
    adaFiveBinariesProduct,
    amount,
    createStakingDashboardState,
    mockPosition,
    renderStakingDashboardComponent,
} from '../../stakingDashboardTestState';

const POOL_ID = 'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj';

const renderCard = (product: StakingProductDescriptor) =>
    renderStakingDashboardComponent(<NewProviderCard account={adaAccount} />, {
        state: createStakingDashboardState({
            accounts: [adaAccount],
            positions: {
                [adaAccount.key]: [
                    mockPosition(product.id, {
                        lockup: 'liquid',
                        balances: {
                            staked: amount('100000000'),
                            pending: amount('0'),
                            unstaking: amount('0'),
                            withdrawable: amount('0'),
                            rewards: amount('0'),
                        },
                        targets: [
                            {
                                address: POOL_ID,
                                providerId: product.providerId,
                                amount: amount('100000000'),
                            },
                        ],
                        operations: ['unstake', 'vote'],
                        warnings:
                            product === adaFiveBinariesProduct
                                ? [{ code: 'outdated-provider', providerId: product.providerId }]
                                : [],
                        details: { kind: 'cardano-delegation', poolId: POOL_ID, drep: null },
                    }),
                ],
            },
        }),
    });

describe('NewProviderCard', () => {
    it('adds an inline migration article link while retaining the single Update provider button', () => {
        renderCard(adaFiveBinariesProduct);

        const link = screen.getByRole('link', { name: messages.TR_LEARN_MORE.defaultMessage });
        const url = new URL(link.getAttribute('href') ?? '');
        expect(url.origin + url.pathname).toBe(
            'https://trezor.io/support/troubleshooting/coins-tokens/fix-cardano-staking-that-s-no-longer-earning-rewards',
        );
        expect(url.hash).toBe('');
        expect(link.getAttribute('target')).toBe('_blank');
        expect(
            screen.getByTestId('@staking/new-provider-card/paragraph').parentElement,
        ).toContainElement(link);
        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.getByRole('button')).toHaveTextContent(
            messages.TR_EARN_UPDATE_PROVIDER.defaultMessage,
        );
    });

    it('does not add the migration link for another staking provider', () => {
        renderCard(adaExternalProduct);

        expect(screen.queryByRole('link')).toBeNull();
        expect(screen.getAllByRole('button')).toHaveLength(1);
    });
});
