import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { RootStackRoutes } from '@suite-native/navigation';
import { mock } from '@trezor/dependency-injection';

import { type StakingNavigateFn, navigateByAccountState } from './navigateByAccountState';

const account = mockWalletAccount({ symbol: asNetworkSymbol('eth') });

describe('navigateByAccountState', () => {
    it.each([true, false])(
        'opens the staking management of an active account when manageable is %s',
        isStakingManageable => {
            const navigate = mock<StakingNavigateFn>();

            expect(
                navigateByAccountState({
                    account,
                    isStakingActive: true,
                    isStakingManageable,
                    navigate,
                }),
            ).toBe(true);
            expect(navigate).toHaveBeenCalledWith(RootStackRoutes.StakingManagement, {
                accountKey: account.key,
            });
        },
    );

    it('opens the staking intro of an inactive account the platform can stake', () => {
        const navigate = mock<StakingNavigateFn>();

        expect(
            navigateByAccountState({
                account,
                isStakingActive: false,
                isStakingManageable: true,
                navigate,
            }),
        ).toBe(true);
        expect(navigate).toHaveBeenCalledWith(RootStackRoutes.HowStakeWorksScreen, {
            symbol: account.symbol,
            accountKey: account.key,
        });
    });

    it('does not navigate an inactive account the platform cannot stake', () => {
        const navigate = mock<StakingNavigateFn>();

        expect(
            navigateByAccountState({
                account,
                isStakingActive: false,
                isStakingManageable: false,
                navigate,
            }),
        ).toBe(false);
        expect(navigate).not.toHaveBeenCalled();
    });
});
