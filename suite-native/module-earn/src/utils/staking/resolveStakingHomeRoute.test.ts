import { asNetworkSymbol } from '@suite-common/wallet-config';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { RootStackRoutes } from '@suite-native/navigation';

import { resolveStakingHomeRoute } from './resolveStakingHomeRoute';

const account = mockWalletAccount({ symbol: asNetworkSymbol('sol') });

describe('resolveStakingHomeRoute', () => {
    it('returns the staking management of an active account', () => {
        expect(resolveStakingHomeRoute({ account, isStakingActive: true })).toEqual({
            name: RootStackRoutes.StakingManagement,
            params: { accountKey: account.key },
        });
    });

    it('returns the staking intro of an inactive account', () => {
        expect(resolveStakingHomeRoute({ account, isStakingActive: false })).toEqual({
            name: RootStackRoutes.HowStakeWorksScreen,
            params: { symbol: account.symbol, accountKey: account.key },
        });
    });
});
