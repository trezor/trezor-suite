// This is iOS version, see the file name.

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';

import { bluetoothActions } from '@suite-common/bluetooth';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

import { SystemUnpairingAlertIosInstructions } from '../components/SystemUnpairingAlertIosInstructions';

export const useBluetoothPlatformSpecificAlerts = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();
    const dispatch = useDispatch();

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
            description: translate('bluetooth.alerts.pairingFailed.description'),
            appendix: <SystemUnpairingAlertIosInstructions />,
            primaryButtonTitle: translate('generic.buttons.gotIt'),
        });
    }, [showAlert, translate]);

    const showSystemUnpairingAlert = useCallback(() => {
        showAlert({
            title: translate('bluetooth.alerts.systemUnpairing.title'),
            textAlign: 'left',
            description: translate('bluetooth.alerts.systemUnpairing.description'),
            appendix: <SystemUnpairingAlertIosInstructions />,
            primaryButtonTitle: translate('generic.buttons.gotIt'),
            onPressPrimaryButton: () => {
                dispatch(bluetoothActions.setIsDeviceOsUnpairingRequired(false));
            },
        });
    }, [showAlert, dispatch, translate]);

    return {
        showBluetoothAdapterDisabledAlert,
        showPairingFailedAlert,
        showSystemUnpairingAlert,
    };
};
