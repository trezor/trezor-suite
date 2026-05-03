import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isSupportedEthStakingNetworkSymbol } from '@suite-common/wallet-utils';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

export const useStakingDetailNavigation = () => {
    const navigation = useNavigation<NavigationProp>();

    const navigateToStakingDetail = useCallback(
        ({ accountKey, symbol }: { accountKey: AccountKey; symbol: NetworkSymbol }) => {
            if (isSupportedEthStakingNetworkSymbol(symbol)) {
                navigation.navigate(RootStackRoutes.StakingManagement, { accountKey });
            } else {
                navigation.navigate(RootStackRoutes.StakingDetail, { accountKey });
            }
        },
        [navigation],
    );

    return { navigateToStakingDetail };
};
