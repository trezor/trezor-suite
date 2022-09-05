import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { useDispatch } from 'react-redux';

import TrezorConnect, { AccountInfo } from '@trezor/connect';
import { CompositeStackToTabScreenProps, Screen } from '@suite-native/navigation';
import { Button } from '@suite-native/atoms';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { AssetsStackParamList, AssetsStackRoutes } from '../navigation/routes';
import { AssetsLoader } from '../components/AssetsLoader';
import { setOnboardingFinished } from '../slice';
import { AssetsHeader } from '../components/AssetsHeader';
import { AssetsOverview, dummyDevices } from '../components/AssetsOverview';
import { importAssetThunk } from '../state/devices/devicesThunks';

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

export const AssetsImport = ({
    navigation,
    route,
}: CompositeStackToTabScreenProps<
    AssetsStackParamList,
    AssetsStackRoutes.AssetsImport,
    RootStackParamList
>) => {
    const dispatch = useDispatch();
    const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [assetName, setAssetName] = useState<string>('bitcoines #1');

    const { applyStyle } = useNativeStyles();

    const { xpubAddress, currencySymbol } = route.params;

    const getAccountInfo = useCallback(() => {
        const showAccountInfoAlert = ({ title, message }: { title: string; message: string }) => {
            Alert.alert(title, message, [
                { text: 'OK, I will fix it', onPress: () => navigation.goBack() },
            ]);
        };

        TrezorConnect.getAccountInfo({
            coin: currencySymbol,
            descriptor: xpubAddress,
            details: 'txs',
        })
            .then(accountInfo => {
                if (accountInfo?.success) {
                    setAccountInfo(accountInfo.payload);
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
        if (accountInfo && selectedDevice) {
            const dummyDevice = dummyDevices.find(device => device.value === selectedDevice);
            if (dummyDevice) {
                const { title } = dummyDevice;
                dispatch(
                    importAssetThunk({
                        deviceId: selectedDevice,
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
        }
    };

    const handleSelectDevice = (value: string | number) => {
        setSelectedDevice(value.toString());
    };

    return (
        <Screen>
            {!accountInfo ? (
                <AssetsLoader />
            ) : (
                <View style={[applyStyle(assetsStyle)]}>
                    <View>
                        <AssetsHeader />
                        <AssetsOverview
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
