import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

export type NavigateToStakingDetail = (params: {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
}) => void;

export const useStakingDetailNavigation = () => {
    const navigation = useNavigation<NavigationProp>();

    const navigateToStakingDetail = useCallback<NavigateToStakingDetail>(
        ({ accountKey }) => {
            navigation.navigate(RootStackRoutes.StakingManagement, { accountKey });
        },
        [navigation],
    );

    return { navigateToStakingDetail };
};
