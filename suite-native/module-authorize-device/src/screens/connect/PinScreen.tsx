import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/device-utils';

import { ConnectDeviceScreenView } from '../../components/connect/ConnectDeviceScreenView';
import { PinOnDevice } from '../../components/connect/PinOnDevice';
import { PinOnKeypad } from '../../components/connect/PinOnKeypad';

export const PinScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();

    const deviceModel = useSelector(selectDeviceModel);

    const onSuccess = useCallback(() => {
        navigateToInitialScreen();
    }, [navigateToInitialScreen]);

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
