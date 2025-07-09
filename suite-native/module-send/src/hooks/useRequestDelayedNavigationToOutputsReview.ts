import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { DeviceRootState, selectDeviceButtonRequestsCodes } from '@suite-common/wallet-core';
import { AccountKey, TokenAddress } from '@suite-common/wallet-types';
import {
    RootStackParamList,
    SendStackParamList,
    SendStackRoutes,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';

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

    const buttonRequestCount = useSelector(
        (state: DeviceRootState) => selectDeviceButtonRequestsCodes(state).length,
    );

    const [waitingForButtonRequests, setWaitingForButtonRequests] = useState(false);

    const requestDelayedNavigationToOutputsReview = useCallback(() => {
        setWaitingForButtonRequests(true);
    }, []);

    useEffect(() => {
        if (buttonRequestCount > 0 && waitingForButtonRequests) {
            setWaitingForButtonRequests(false);

            navigation.navigate(SendStackRoutes.SendOutputsReview, {
                accountKey,
                tokenContract,
            });
        }
    }, [accountKey, buttonRequestCount, navigation, tokenContract, waitingForButtonRequests]);

    return requestDelayedNavigationToOutputsReview;
};
