import { deviceInitialState } from '@suite-common/device';
import { mockStakingState } from '@suite-common/earn-staking/mocks';
import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import {
    mockStakingPosition,
    mockStakingProductDescriptor,
} from '@suite-common/earn-staking-common/mocks';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockNetworksState } from '@suite-common/networks/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { getTranslation } from '@suite-native/intl';
import { renderWithStoreProvider, screen } from '@suite-native/test-utils-store';

import { StakingManagementPendingSection } from './StakingManagementPendingSection';
import { EarnPortfolioTrackerGuard } from '../earn/EarnPortfolioTrackerGuard';

// The bottom sheet mock renders the closed modal's duplicate "Unstaking" label.
jest.mock('./StakingManagementUnstakingModal', () => ({
    StakingManagementUnstakingModal: () => null,
}));

describe('StakingManagementPendingSection', () => {
    it('shows both claim and cooldown when the Solana amounts are equal', async () => {
        const sol = asNetworkSymbol('sol');
        const account = mockWalletAccount({ symbol: sol });
        const product = mockStakingProductDescriptor({ networkSymbol: sol, type: 'native' });
        const amount = stakingAmountSchema.parse('1000000000');
        const zero = stakingAmountSchema.parse('0');
        const position = mockStakingPosition({
            productId: product.id,
            status: 'deactivating',
            balances: {
                staked: zero,
                pending: zero,
                unstaking: amount,
                withdrawable: amount,
                rewards: zero,
            },
            operations: ['withdraw'],
            unlocks: [{ amount, availableAt: null }],
            targets: [],
        });
        const services: NativeAnalyticsDep = { analytics: mockNativeAnalytics() };

        await renderWithStoreProvider(
            <StakingManagementPendingSection accountKey={account.key} />,
            {
                wrapper: EarnPortfolioTrackerGuard,
                services,
                preloadedState: {
                    device: deviceInitialState,
                    messageSystem: messageSystemInitialState,
                    networks: mockNetworksState([sol]),
                    wallet: { accounts: [account], fiat: { current: {}, lastWeek: {} } },
                    earn: {
                        staking: mockStakingState({
                            platform: 'mobile',
                            descriptors: [product],
                            positions: { [account.key]: [position] },
                        }),
                    },
                },
            },
        );

        expect(
            screen.getByText(getTranslation('earn.stakingManagementScreen.claim.claimButton')),
        ).toBeOnTheScreen();
        expect(
            screen.getByText(
                getTranslation('earn.stakingManagementScreen.unstakingItem.labelWithoutDays'),
            ),
        ).toBeOnTheScreen();
    });
});
