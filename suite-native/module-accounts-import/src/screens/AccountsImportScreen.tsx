import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useDispatch } from 'react-redux';

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

import { AccountImportLoader } from '../components/AccountImportLoader';
import { AccountImportHeader } from '../components/AccountImportHeader';
import { AccountImportOverview, DummyDevice } from '../components/AccountImportOverview';
import { importAccountThunk } from '../accountsThunks';

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
    const dispatch = useDispatch();
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<DummyDevice>();
    const [assetName, setAssetName] = useState<string>('bitcoines #1');

    const { applyStyle } = useNativeStyles();

    const { xpubAddress, currencySymbol } = route.params;

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
        if (accountInfo && selectedDevice) {
            const { title, value } = selectedDevice;
            dispatch(
                importAccountThunk({
                    deviceId: value,
                    deviceTitle: title,
                    accountInfo,
                    coin: currencySymbol,
                }),
            );
            dispatch(setOnboardingFinished(true));
            navigation.navigate(RootStackRoutes.App, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    };

    const handleSelectDevice = (device: DummyDevice) => {
        setSelectedDevice(device);
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
                            selectedDevice={selectedDevice}
                            assetName={assetName}
                            onSelectDevice={handleSelectDevice}
                            onAssetNameChange={setAssetName}
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
