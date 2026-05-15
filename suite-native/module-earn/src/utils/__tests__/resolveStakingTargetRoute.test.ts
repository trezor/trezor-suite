import { RootStackRoutes } from '@suite-native/navigation';

import { resolveStakingTargetRoute } from '../resolveStakingTargetRoute';

describe('resolveStakingTargetRoute', () => {
    it('routes Ethereum accounts to StakingManagement', () => {
        expect(resolveStakingTargetRoute('eth')).toBe(RootStackRoutes.StakingManagement);
    });

    it('routes Solana accounts to StakingManagement', () => {
        expect(resolveStakingTargetRoute('sol')).toBe(RootStackRoutes.StakingManagement);
    });

    it('routes Cardano accounts to StakingDetail', () => {
        expect(resolveStakingTargetRoute('ada')).toBe(RootStackRoutes.StakingDetail);
    });
});
