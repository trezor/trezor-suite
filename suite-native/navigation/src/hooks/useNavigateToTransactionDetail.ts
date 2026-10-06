import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { type RootStackParamList, type TransactionDetailStackParamList } from '../navigators';
import { RootStackRoutes, TransactionDetailStackRoutes } from '../routes';
import { type StackNavigationProps } from '../types';

type NavigationProp = StackNavigationProps<
    RootStackParamList,
    RootStackRoutes.TransactionDetailStack
>;

type TransactionDetailParams =
    TransactionDetailStackParamList[TransactionDetailStackRoutes.TransactionDetail];

export const useNavigateToTransactionDetail = () => {
    const navigation = useNavigation<NavigationProp>();

    return useCallback(
        (params: TransactionDetailParams) =>
            navigation.navigate(RootStackRoutes.TransactionDetailStack, {
                screen: TransactionDetailStackRoutes.TransactionDetail,
                params,
            }),
        [navigation],
    );
};
