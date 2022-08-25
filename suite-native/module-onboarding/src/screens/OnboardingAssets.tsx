import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useDispatch } from 'react-redux';

import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { Screen, StackProps } from '@suite-native/navigation';
import { Button } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { OnboardingStackParamList, OnboardingStackRoutes } from '../navigation/routes';
import { AssetsLoader } from '../components/AssetsLoader';
import { setOnboardingFinished } from '../slice';
import { AssetsHeader } from '../components/AssetsHeader';
import { AssetsOverview } from '../components/AssetsOverview';

const assetsStyle = prepareNativeStyle(_ => ({
    flex: 1,
    justifyContent: 'space-between',
}));

const importAnotherWrapperStyle = prepareNativeStyle(_ => ({
    alignItems: 'center',
}));

const importAnotherButtonStyle = prepareNativeStyle(utils => ({
    borderRadius: utils.borders.radii.round,
    width: 165,
}));

export const OnboardingAssets = ({
    navigation,
    route,
}: StackProps<OnboardingStackParamList, OnboardingStackRoutes.OnboardingAssets>) => {
    const dispatch = useDispatch();
    const [accountInfoLoaded, setAccountInfoLoaded] = useState<boolean>(false);
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const { applyStyle } = useNativeStyles();

    const { xpubAddress, currencySymbol } = route.params;

    const getAccountInfo = useCallback(() => {
        const showAccountInfoAlert = ({ title, message }: { title: string; message: string }) => {
            Alert.alert(title, message, [
                {
                    text: "Doesn't matter, show me assets",
                    onPress: () => setAccountInfoLoaded(true),
                },
                { text: 'OK, will fix it', onPress: () => navigation.goBack() },
            ]);
        };

        TrezorConnect.getAccountInfo({
            coin: currencySymbol,
            descriptor:
                'zpub6rszzdAK6RuafeRwyN8z1cgWcXCuKbLmjjfnrW4fWKtcoXQ8787214pNJjnBG5UATyghuNzjn6Lfp5k5xymrLFJnCy46bMYJPyZsbpFGagT',
            path: "m/84'/0'/0'",
            details: 'txs',
        })
            .then(accountInfo => {
                if (accountInfo?.success) {
                    setAccountInfo(accountInfo.payload);
                    setAccountInfoLoaded(true);
                } else {
                    showAccountInfoAlert({
                        title: 'Account info failed',
                        message: accountInfo.payload?.error ?? '',
                    });
                }
            })
            .catch(error => {
                showAccountInfoAlert({
                    title: 'Account info failed',
                    message: error?.message ?? '',
                });
            });
    }, [xpubAddress, currencySymbol, navigation]);

    useEffect(() => {
        // FIXME: setTimeout is present only to allow for loading screen to be visible for 800ms.
        // It will be handled by extra builders from redux toolkit when it's implemented in thunks (pending, fulfilled..)
        const fetchingTimerId = setTimeout(() => {
            getAccountInfo();
        }, 800);

        return () => clearTimeout(fetchingTimerId);
    }, [getAccountInfo]);

    const handleConfirmAssets = () => {
        dispatch(setOnboardingFinished(true));
    };

    return (
        <Screen>
            {!accountInfoLoaded ? (
                <AssetsLoader />
            ) : (
                <View style={[applyStyle(assetsStyle)]}>
                    <View>
                        <AssetsHeader />
                        <AssetsOverview accountInfo={accountInfo} />
                    </View>
                    <View style={applyStyle(importAnotherWrapperStyle)}>
                        <Button
                            style={applyStyle(importAnotherButtonStyle)}
                            onPress={() => navigation.goBack()}
                            colorScheme="gray"
                        >
                            Import another
                        </Button>
                    </View>
                    <Button onPress={handleConfirmAssets} size="large">
                        Confirm
                    </Button>
                </View>
            )}
        </Screen>
    );
};
