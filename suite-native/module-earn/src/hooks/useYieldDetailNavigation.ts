import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.YieldManagement>;

export type NavigateToYieldDetail = (params: {
    accountKey: AccountKey;
    tokenContract: TokenAddress;
}) => void;

export const useYieldDetailNavigation = () => {
    const navigation = useNavigation<NavigationProp>();

    const navigateToYieldDetail = useCallback<NavigateToYieldDetail>(
        ({ accountKey, tokenContract }) => {
            navigation.navigate(RootStackRoutes.YieldManagement, { accountKey, tokenContract });
        },
        [navigation],
    );

    return { navigateToYieldDetail };
};
