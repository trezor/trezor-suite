import { useNetworkStakingRate } from '@suite-common/earn-staking';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';

import { StakingApyBadge } from './StakingApyBadge';

jest.mock('@suite-common/earn-staking', () => ({
    ...jest.requireActual('@suite-common/earn-staking'),
    useNetworkStakingRate: jest.fn(),
}));

const ada = asNetworkSymbol('ada');
const account = mockWalletAccount({ symbol: ada });
const descriptor = mockStakingProductDescriptor({ networkSymbol: ada });

const renderBadge = (position: ReturnType<typeof mockStakingPosition>) =>
    renderWithStoreProvider(<StakingApyBadge account={account} />, {
        preloadedState: {
            wallet: { accounts: [account] },
            earn: {
                staking: mockStakingState({
                    platform: 'mobile',
                    descriptors: [descriptor],
                    positions: { [account.key]: [{ ...position, productId: descriptor.id }] },
                }),
            },
        },
    });

describe('StakingApyBadge', () => {
    it('shows 0% APY for a registered Cardano key without a pool while rates load', async () => {
        jest.mocked(useNetworkStakingRate).mockReturnValue({
            rate: null,
            rateKind: 'apy',
            isPending: true,
        });

        await renderBadge(mockStakingPosition({ warnings: [{ code: 'no-stake-pool' }] }));

        expect(screen.getByText('0% APY')).toBeOnTheScreen();
    });

    it('shows the rate while a stake operation is pending', async () => {
        jest.mocked(useNetworkStakingRate).mockReturnValue({
            rate: 3.25,
            rateKind: 'apy',
            isPending: false,
        });

        await renderBadge(
            mockStakingPosition({
                warnings: [{ code: 'no-stake-pool' }],
                pendingTransactions: [{ txid: 'pending-delegation', operation: 'stake' }],
            }),
        );

        expect(screen.getByText('3.25% APY')).toBeOnTheScreen();
    });

    it('shows the rate when the account has a pool', async () => {
        jest.mocked(useNetworkStakingRate).mockReturnValue({
            rate: 3.25,
            rateKind: 'apy',
            isPending: false,
        });

        await renderBadge(mockStakingPosition());

        expect(screen.getByText('3.25% APY')).toBeOnTheScreen();
    });
});
