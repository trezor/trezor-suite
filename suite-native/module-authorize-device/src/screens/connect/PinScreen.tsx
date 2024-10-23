import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectDeviceModel } from '@suite-common/wallet-core';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/connect';

import { ConnectDeviceScreenView } from '../../components/connect/ConnectDeviceScreenView';
import { PinOnDevice } from '../../components/connect/PinOnDevice';
import { PinOnKeypad } from '../../components/connect/PinOnKeypad';

type NavigationProp = StackToStackCompositeNavigationProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.PinMatrix,
    RootStackParamList
>;

export const PinScreen = () => {
    const navigation = useNavigation<NavigationProp>();

    const deviceModel = useSelector(selectDeviceModel);

    const onSuccess = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [navigation]);

    if (!deviceModel) return null;

    return (
        <ConnectDeviceScreenView>
            {deviceModel === DeviceModelInternal.T1B1 ? (
                <PinOnKeypad variant="current" onSuccess={onSuccess} />
            ) : (
                <PinOnDevice deviceModel={deviceModel} />
            )}
        </ConnectDeviceScreenView>
    );
};
