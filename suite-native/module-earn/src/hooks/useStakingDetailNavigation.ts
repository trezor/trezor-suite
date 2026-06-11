import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { isSupportedSolStakingNetworkSymbol } from '@suite-common/wallet-utils';
import {
    type RootStackParamList,
    RootStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { useSolanaStakingFlag } from './useSolanaStakingFlag';
import { resolveStakingTargetRoute } from '../utils/resolveStakingTargetRoute';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.StakingManagement>;

export type NavigateToStakingDetail = (params: {
    accountKey: AccountKey;
    symbol: NetworkSymbol;
}) => void;

export const useStakingDetailNavigation = () => {
    const navigation = useNavigation<NavigationProp>();
    const isSolanaStakingEnabled = useSolanaStakingFlag();

    const navigateToStakingDetail = useCallback<NavigateToStakingDetail>(
        ({ accountKey, symbol }) => {
            if (isSupportedSolStakingNetworkSymbol(symbol) && !isSolanaStakingEnabled) {
                navigation.navigate(RootStackRoutes.StakingDetail, { accountKey });

                return;
            }

            navigation.navigate(resolveStakingTargetRoute(symbol), { accountKey });
        },
        [navigation, isSolanaStakingEnabled],
    );

    return { navigateToStakingDetail };
};
