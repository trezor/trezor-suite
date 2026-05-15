import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    type RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { resolveStakingTargetRoute } from '../utils/resolveStakingTargetRoute';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

export const useStakingDetailNavigation = () => {
    const navigation = useNavigation<NavigationProp>();

    const navigateToStakingDetail = useCallback(
        ({ accountKey, symbol }: { accountKey: AccountKey; symbol: NetworkSymbol }) => {
            navigation.navigate(resolveStakingTargetRoute(symbol), { accountKey });
        },
        [navigation],
    );

    return { navigateToStakingDetail };
};
