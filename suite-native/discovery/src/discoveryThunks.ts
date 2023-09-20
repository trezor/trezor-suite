import { createThunk } from '@suite-common/redux-utils';
import { TrezorDevice } from '@suite-common/suite-types';
import {
    createDiscoveryThunk,
    DISCOVERY_MODULE_PREFIX,
    startDiscoveryThunk,
} from '@suite-common/wallet-core';

export const createAndStartDiscoveryThunk = createThunk(
    `${DISCOVERY_MODULE_PREFIX}/createAndStart`,
    async (
        { deviceState, device }: { deviceState: string; device: TrezorDevice },
        { dispatch },
    ) => {
        await dispatch(
            createDiscoveryThunk({
                deviceState,
                device,
            }),
        );

        dispatch(startDiscoveryThunk());
    },
);
