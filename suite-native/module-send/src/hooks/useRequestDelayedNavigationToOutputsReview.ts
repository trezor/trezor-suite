import { useCallback } from 'react';

import { useNavigation } from '@react-navigation/native';

import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    RootStackParamList,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useWaitForButtonRequest } from '@suite-native/transaction-management';

type NavigationProps = StackToStackCompositeNavigationProps<
    SendStackParamList,
    SendStackRoutes.SendFees,
    RootStackParamList
>;

type UseRequestDelayedNavigationToOutputsReviewProps = {
    accountKey: AccountKey;
    tokenContract?: TokenAddress;
};

export const useRequestDelayedNavigationToOutputsReview = ({
    accountKey,
    tokenContract,
}: UseRequestDelayedNavigationToOutputsReviewProps) => {
    const navigation = useNavigation<NavigationProps>();

    const navigateToOutputsReview = useCallback(() => {
        navigation.navigate(SendStackRoutes.SendOutputsReview, {
            accountKey,
            tokenContract,
        });
    }, [accountKey, navigation, tokenContract]);

    return useWaitForButtonRequest(navigateToOutputsReview);
};
