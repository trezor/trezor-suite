import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import TrezorConnect, { AccountInfo } from '@trezor/connect';
import {
    StackToTabCompositeScreenProps,
    Screen,
    RootStackRoutes,
    AppTabsRoutes,
    AccountsImportStackRoutes,
    HomeStackRoutes,
    RootStackParamList,
    AccountsImportStackParamList,
} from '@suite-native/navigation';
import { Button } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { setOnboardingFinished } from '@suite-native/module-settings';
import { AccountsRootState, selectAccountsByNetworkAndDevice } from '@suite-common/wallet-core';

import { AccountImportLoader } from '../components/AccountImportLoader';
import { AccountImportHeader } from '../components/AccountImportHeader';
import { AccountImportOverview } from '../components/AccountImportOverview';
import { HIDDEN_DEVICE_ID, HIDDEN_DEVICE_STATE, importAccountThunk } from '../accountsImportThunks';

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

export const AccountsImportScreen = ({
    navigation,
    route,
}: StackToTabCompositeScreenProps<
    AccountsImportStackParamList,
    AccountsImportStackRoutes.AccountImport,
    RootStackParamList
>) => {
    const { xpubAddress, currencySymbol } = route.params;
    const dispatch = useDispatch();
    const deviceNetworkAccounts = useSelector((state: AccountsRootState) =>
        selectAccountsByNetworkAndDevice(state, HIDDEN_DEVICE_STATE, currencySymbol),
    );
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const [accountLabel, setAccountLabel] = useState<string>(
        `${currencySymbol} #${deviceNetworkAccounts.length + 1}`,
    );

    const { applyStyle } = useNativeStyles();

    useEffect(() => {
        let ignore = false;

        const showAccountInfoAlert = ({ title, message }: { title: string; message: string }) => {
            Alert.alert(title, message, [
                { text: 'OK, I will fix it', onPress: () => navigation.goBack() },
            ]);
        };

        async function getAccountInfo() {
            const accountInfo = await TrezorConnect.getAccountInfo({
                coin: currencySymbol,
                descriptor: xpubAddress,
                details: 'txs',
            });
            if (!ignore) {
                if (accountInfo?.success) {
                    setAccountInfo(accountInfo.payload);
                } else {
                    showAccountInfoAlert({
                        title: 'Account info failed',
                        message: accountInfo.payload?.error ?? '',
                    });
                }
            }
        }
        try {
            getAccountInfo();
        } catch (error) {
            showAccountInfoAlert({
                title: 'Account info failed',
                message: error?.message ?? '',
            });
        }

        return () => {
            ignore = true;
        };
    }, [xpubAddress, currencySymbol, navigation]);

    const handleConfirmAssets = () => {
        if (accountInfo) {
            dispatch(
                importAccountThunk({
                    deviceId: HIDDEN_DEVICE_ID,
                    deviceTitle: 'Hidden Device',
                    accountInfo,
                    accountLabel,
                    coin: currencySymbol,
                }),
            );
            dispatch(setOnboardingFinished(true));
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    };

    return (
        <Screen>
            {!accountInfo ? (
                <AccountImportLoader />
            ) : (
                <View style={[applyStyle(assetsStyle)]}>
                    <View>
                        <AccountImportHeader />
                        <AccountImportOverview
                            accountInfo={accountInfo}
                            assetName={accountLabel}
                            currencySymbol={currencySymbol}
                            onChangeAccountName={setAccountLabel}
                        />
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
