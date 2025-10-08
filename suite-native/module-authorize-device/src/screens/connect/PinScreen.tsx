import { useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectDeviceModel } from '@suite-common/wallet-core';
import { selectDeviceRequestedPin } from '@suite-native/device-authorization';
import { useNavigateToInitialScreen } from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/device-utils';

import { ConnectDeviceScreenView } from '../../components/connect/ConnectDeviceScreenView';
import { PinOnDevice } from '../../components/connect/PinOnDevice';
import { PinOnKeypad } from '../../components/connect/PinOnKeypad';

export const PinScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const hasDeviceRequestedPin = useSelector(selectDeviceRequestedPin);
    const prevHasDeviceRequestedPin = useRef(false);

    const deviceModel = useSelector(selectDeviceModel);

    const onSuccess = useCallback(() => {
        navigateToInitialScreen();
    }, [navigateToInitialScreen]);

    useEffect(() => {
        if (hasDeviceRequestedPin && prevHasDeviceRequestedPin.current === false) {
            prevHasDeviceRequestedPin.current = true;
        }
    }, [hasDeviceRequestedPin]);

    if (!deviceModel) return null;

    // When the app redirects here, the state hasn't changed yet and hasDeviceRequestedPin is still false, thus not sufficient.
    // Simple hasDeviceRequestedPin check would return null before the success state on PinOnDevice would be able to run.
    if (!hasDeviceRequestedPin && !prevHasDeviceRequestedPin.current) return null;

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
