import { selectFirmware } from '@suite-common/firmware/src/firmwareReducer';
import { createThunk } from '@suite-common/redux-utils';
import { Device } from '@trezor/connect';

import { THP_PREFIX, thpActions } from './thpActions';
import { selectThpCredentials } from './thpSelectors';

const NUMBER_OF_CONNECTIONS_TO_ASK_FOR_AUTOCONNECT = 3;

type ConnectThpDeviceThinkParams = {
    device: Pick<Device, 'thp'>;
};

export const connectThpDeviceThunk = createThunk<void, ConnectThpDeviceThinkParams, void>(
    `${THP_PREFIX}/connectThpDeviceThunk`,
    ({ device }, { dispatch, getState }) => {
        const credentials = selectThpCredentials(getState());
        const isFwInstall = selectFirmware(getState()).status !== 'initial';

        const credential = credentials.find(
            stateCredential =>
                device.thp?.credentials.find(
                    deviceCredential => deviceCredential.credential === stateCredential.credential,
                ) !== undefined,
        );

        if (credential !== undefined) {
            // We do not want to offer Autoconnect after reconnection dues to Firmware installation.
            // Autoconnect will be offered on the next reconnection.
            if (!isFwInstall) {
                dispatch(thpActions.incrementCredentialConnectionCounter({ credential }));
            }

            const shallShowAutoConnectDialog =
                // -1 because it was just about incremented
                credential.connectionCounter === NUMBER_OF_CONNECTIONS_TO_ASK_FOR_AUTOCONNECT - 1;

            dispatch(
                shallShowAutoConnectDialog
                    ? thpActions.showAutoconnectInfo()
                    : thpActions.resetThpFlow(),
            );
        } else {
            dispatch(thpActions.resetThpFlow());
        }
    },
);
