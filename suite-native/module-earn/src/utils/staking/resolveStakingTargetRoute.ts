import { type NetworkSymbol } from '@suite-common/wallet-config';
import { RootStackRoutes } from '@suite-native/navigation';
import { exhaustive } from '@trezor/type-utils';

import { getMobileStakingSupport } from './mobileStakingSupport';

export const resolveStakingTargetRoute = (symbol: NetworkSymbol) => {
    const support = getMobileStakingSupport(symbol);

    switch (support) {
        case 'manage':
        case 'view':
            return RootStackRoutes.StakingManagement;
        case 'desktop-only':
        case null:
            return RootStackRoutes.StakingDetail;
        default:
            return exhaustive(support);
    }
};
