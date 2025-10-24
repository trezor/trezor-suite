import { useDispatch, useSelector } from 'react-redux';

import { bluetoothActions } from '@suite-common/bluetooth';
import {
    selectIsBluetoothSupportedByDevice,
    selectIsDeviceConnected,
} from '@suite-common/wallet-core';
import { ConnectAndUnlockDeviceScreenContent } from '@suite-native/device';
import {
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes,
    RootStackParamList,
    StackToStackCompositeScreenProps,
} from '@suite-native/navigation';

import { ConnectDeviceScreen } from '../../components/connect/ConnectDeviceScreen';
import { ConnectingTrezorHelp } from '../../components/connect/ConnectingTrezorHelp';

export const ConnectAndUnlockDeviceScreen = ({
    navigation,
}: StackToStackCompositeScreenProps<
    AuthorizeDeviceStackParamList,
    AuthorizeDeviceStackRoutes.ConnectAndUnlockDevice,
    RootStackParamList
>) => {
    const dispatch = useDispatch();

    const isDeviceConnected = useSelector(selectIsDeviceConnected);
    const isBluetoothSupportedByDevice = useSelector(selectIsBluetoothSupportedByDevice);
    const isBluetoothButtonVisible = !isDeviceConnected || isBluetoothSupportedByDevice;

    const navigateToTurnOnAndUnlockDeviceScreen = () => {
        // Make sure auto-connect is enabled in case some device was manually disconnected.
        dispatch(bluetoothActions.enableAutoConnect());
        navigation.replace(AuthorizeDeviceStackRoutes.TurnOnAndUnlockDevice);
    };

    return (
        <ConnectDeviceScreen helpButton={<ConnectingTrezorHelp />}>
            <ConnectAndUnlockDeviceScreenContent
                onConnectViaBluetooth={
                    isBluetoothButtonVisible ? navigateToTurnOnAndUnlockDeviceScreen : undefined
                }
            />
        </ConnectDeviceScreen>
    );
};
