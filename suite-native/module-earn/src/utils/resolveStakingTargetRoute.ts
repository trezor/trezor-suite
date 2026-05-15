import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isSupportedNativeStakingManagementSymbol } from '@suite-common/wallet-utils';
import { RootStackRoutes } from '@suite-native/navigation';

export const resolveStakingTargetRoute = (symbol: NetworkSymbol) => {
    if (isSupportedNativeStakingManagementSymbol(symbol)) {
        return RootStackRoutes.StakingManagement;
    }

    return RootStackRoutes.StakingDetail;
};
