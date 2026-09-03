import {
    isSupportedAdaStakingNetworkSymbol,
    isSupportedNativeStakingManagementSymbol,
} from '@suite-common/staking';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { RootStackRoutes } from '@suite-native/navigation';

export const resolveStakingTargetRoute = (symbol: NetworkSymbol) => {
    if (
        isSupportedNativeStakingManagementSymbol(symbol) ||
        isSupportedAdaStakingNetworkSymbol(symbol)
    ) {
        return RootStackRoutes.StakingManagement;
    }

    return RootStackRoutes.StakingDetail;
};
