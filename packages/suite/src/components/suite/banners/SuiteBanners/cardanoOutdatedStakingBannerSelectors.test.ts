import { type StakingPosition } from '@suite-common/earn-staking-common';
import { type Account } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    ADA,
    TRX,
    ZERO_BALANCES,
    adaFiveBinariesProduct,
    amount,
    createStakingDashboardState,
    mockPosition,
    trxProduct,
} from '#src/views/wallet/staking/components/stakingDashboardTestState';

import { selectIsCardanoOutdatedStakingBannerShown } from './cardanoOutdatedStakingBannerSelectors';

const HUNDRED_ADA = '100000000';
const ADA_REWARDS = '3000000';

const outdatedProviderWarning: StakingPosition['warnings'] = [
    { code: 'outdated-provider', providerId: adaFiveBinariesProduct.providerId },
];

// A delegation to a retired pool: the reward balance is delegated with the stake.
const retiredPosition = (available: string) =>
    mockPosition(adaFiveBinariesProduct.id, {
        lockup: 'liquid',
        balances: {
            ...ZERO_BALANCES,
            staked: amount(String(Number(available) + Number(ADA_REWARDS))),
            rewards: amount(ADA_REWARDS),
        },
        operations: ['unstake', 'claim', 'vote'],
        warnings: outdatedProviderWarning,
    });

const createState = (account: Account, position: StakingPosition) =>
    createStakingDashboardState({ accounts: [account], positions: { [account.key]: [position] } });

describe('selectIsCardanoOutdatedStakingBannerShown', () => {
    it('shows the banner for a retired delegation with spendable ADA', () => {
        const account = mockWalletAccount({ symbol: ADA, availableBalance: HUNDRED_ADA });

        expect(
            selectIsCardanoOutdatedStakingBannerShown(
                createState(account, retiredPosition(HUNDRED_ADA)),
            ),
        ).toBe(true);
    });

    it('hides the banner for a retired delegation that holds rewards alone', () => {
        const account = mockWalletAccount({ symbol: ADA, availableBalance: '0' });

        expect(
            selectIsCardanoOutdatedStakingBannerShown(createState(account, retiredPosition('0'))),
        ).toBe(false);
    });

    it('hides the banner for a delegation without the warning', () => {
        const account = mockWalletAccount({ symbol: ADA, availableBalance: HUNDRED_ADA });
        const position = { ...retiredPosition(HUNDRED_ADA), warnings: [] };

        expect(selectIsCardanoOutdatedStakingBannerShown(createState(account, position))).toBe(
            false,
        );
    });

    it('hides the banner for an outdated provider on another network', () => {
        const account = mockWalletAccount({ symbol: TRX, availableBalance: HUNDRED_ADA });
        const position = mockPosition(trxProduct.id, {
            balances: { ...ZERO_BALANCES, staked: amount(HUNDRED_ADA) },
            warnings: outdatedProviderWarning,
        });

        expect(selectIsCardanoOutdatedStakingBannerShown(createState(account, position))).toBe(
            false,
        );
    });
});
