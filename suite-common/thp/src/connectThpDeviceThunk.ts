import { createThunk } from '@suite-common/redux-utils';
import { Device } from '@trezor/connect';

import { THP_PREFIX, thpActions } from './thpActions';
import { NUMBER_OF_CONNECTIONS_TO_ASK_FOR_AUTOCONNECT } from './thpConstants';
import { selectIsThpInProgress, selectThpCredentials } from './thpSelectors';

type ConnectThpDeviceThinkParams = {
    device: Pick<Device, 'thp'>;
};

export const connectThpDeviceThunk = createThunk<void, ConnectThpDeviceThinkParams, void>(
    `${THP_PREFIX}/connectThpDeviceThunk`,
    ({ device }, { dispatch, getState }) => {
        const credentials = selectThpCredentials(getState());
        const isThpInProgress = selectIsThpInProgress(getState());

        const credential = credentials.find(stateCredential =>
            device.thp?.credentials.some(
                deviceCredential => deviceCredential.credential === stateCredential.credential,
            ),
        );

        if (credential !== undefined && isThpInProgress) {
            dispatch(thpActions.incrementCredentialConnectionCounter({ credential }));

            const hasAutoConnectCredential = device?.thp?.credentials?.some(c => c?.autoconnect);
            const shallShowAutoConnectDialog =
                // subtract 1 because the counter has just been incremented
                credential.connectionCounter === NUMBER_OF_CONNECTIONS_TO_ASK_FOR_AUTOCONNECT - 1 &&
                !hasAutoConnectCredential;

            dispatch(
                shallShowAutoConnectDialog
                    ? thpActions.showAutoconnectInfo()
                    : thpActions.finishThpFlow(),
            );
        } else {
            dispatch(thpActions.finishThpFlow());
        }
    },
);
