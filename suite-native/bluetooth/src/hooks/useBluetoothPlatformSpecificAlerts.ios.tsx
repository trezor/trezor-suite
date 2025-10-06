// This is iOS version, see the file name.

import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectDeviceName } from '@suite-common/wallet-core';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

import { setShouldShowSystemUnpairingAlert } from '../bluetoothSlice';
import { SystemUnpairingAlertIosInstructions } from '../components/SystemUnpairingAlertIosInstructions';

export const useBluetoothPlatformSpecificAlerts = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const dispatch = useDispatch();
    const deviceName = useSelector(selectDeviceName);

    const showBluetoothAdapterDisabledAlert = useCallback(() => {
        showAlert({
            type: 'bluetoothAdapter',
            title: translate('bluetooth.alerts.adapterDisabled.title'),
            description: translate('bluetooth.alerts.adapterDisabled.description.ios'),
            primaryButtonTitle: translate('generic.buttons.gotIt'),
        });
    }, [showAlert, translate]);

    const showPairingFailedAlert = useCallback(() => {
        showAlert({
            title: translate('bluetooth.alerts.pairingFailed.title'),
            description: (
                <SystemUnpairingAlertIosInstructions translationKey="bluetooth.alerts.pairingFailed.description" />
            ),
            primaryButtonTitle: translate('generic.buttons.gotIt'),
        });
    }, [showAlert, translate]);

    const showSystemUnpairingAlert = useCallback(() => {
        showAlert({
            title: translate('bluetooth.alerts.systemUnpairing.title.ios'),
            textAlign: 'left',
            description: (
                <SystemUnpairingAlertIosInstructions
                    translationKey="bluetooth.alerts.systemUnpairing.description.ios"
                    deviceName={deviceName}
                />
            ),
            primaryButtonTitle: translate('generic.buttons.gotIt'),
            onPressPrimaryButton: () => {
                dispatch(setShouldShowSystemUnpairingAlert(false));
            },
        });
    }, [showAlert, dispatch, translate, deviceName]);

    return {
        showBluetoothAdapterDisabledAlert,
        showPairingFailedAlert,
        showSystemUnpairingAlert,
    };
};
