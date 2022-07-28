import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import TrezorConnect, { Unsuccessful, Success, AccountInfo } from '@trezor/connect';
import { StackProps } from '@suite-native/navigation';
import { Text } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OnboardingStackParamList, OnboardingStackRoutes } from '../navigation/routes';

const actionScreenStyle = prepareNativeStyle(() => ({
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
}));

export const OnboardingFetching = ({
    navigation,
    route,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.OnboardingFetching>) => {
    const [accountInfo, setAccountInfo] = useState<Success<AccountInfo> | Unsuccessful | null>(
        null,
    );
    const [fetchingTimeoutFulfilled, setFetchingTimeoutFulfilled] = useState(false);
    const { applyStyle } = useNativeStyles();

    const { xpubAddress, network } = route.params;

    console.log('*************** xpubAddress: ', xpubAddress);
    console.log('*************** network: ', network);

    const getAccountInfo = useCallback(() => {
        TrezorConnect.getAccountInfo({
            coin: network,
            descriptor: xpubAddress,
        })
            .then(accountInfo => {
                setAccountInfo(accountInfo);
            })
            .catch(error => {
                // eslint-disable-next-line no-console
                console.log('getAccountInfo failed: ', JSON.stringify(error));
            });
    }, [xpubAddress, network]);

    useEffect(() => {
        getAccountInfo();
    }, [getAccountInfo]);

    useEffect(() => {
        const fetchingTimerId = setTimeout(() => {
            setFetchingTimeoutFulfilled(true);
        }, 800);

        return () => clearTimeout(fetchingTimerId);
    }, []);

    const goToImportedAssets = useCallback(
        (accountInfoPayload: AccountInfo) => {
            navigation.navigate(OnboardingStackRoutes.OnboardingAssets, {
                accountInfo: accountInfoPayload,
            });
        },
        [navigation],
    );

    useEffect(() => {
        if (fetchingTimeoutFulfilled && accountInfo?.success) {
            // eslint-disable-next-line no-console
            console.log('Account info result: ', JSON.stringify(accountInfo, null, 2));
            goToImportedAssets(accountInfo.payload);
        }
    }, [accountInfo, fetchingTimeoutFulfilled, goToImportedAssets]);

    return (
        <View style={[applyStyle(actionScreenStyle)]}>
            <Text variant="titleMedium" color="black">
                Checking Balances...
            </Text>
            <Text variant="titleMedium" color="black" style={{ opacity: 0.3 }}>
                Fetching tx history...
            </Text>
            <Text variant="titleMedium" color="black" style={{ opacity: 0.1 }}>
                something...
            </Text>
        </View>
    );
};
