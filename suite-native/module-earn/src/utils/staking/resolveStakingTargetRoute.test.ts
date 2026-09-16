import { asNetworkSymbol } from '@suite-common/wallet-config';
import { RootStackRoutes } from '@suite-native/navigation';

import { resolveStakingTargetRoute } from './resolveStakingTargetRoute';

describe('resolveStakingTargetRoute', () => {
    it('routes Ethereum accounts to StakingManagement', () => {
        expect(resolveStakingTargetRoute(asNetworkSymbol('eth'))).toBe(
            RootStackRoutes.StakingManagement,
        );
    });

    it('routes Solana accounts to StakingManagement', () => {
        expect(resolveStakingTargetRoute(asNetworkSymbol('sol'))).toBe(
            RootStackRoutes.StakingManagement,
        );
    });

    it('routes Cardano accounts to StakingManagement', () => {
        expect(resolveStakingTargetRoute(asNetworkSymbol('ada'))).toBe(
            RootStackRoutes.StakingManagement,
        );
    });

    it('routes Tron accounts to StakingDetail', () => {
        expect(resolveStakingTargetRoute(asNetworkSymbol('trx'))).toBe(
            RootStackRoutes.StakingDetail,
        );
    });
});
