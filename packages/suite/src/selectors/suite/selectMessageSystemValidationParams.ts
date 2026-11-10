import { type TorRootState, selectIsTorEnabled } from '@suite/tor';
import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type GeolocationRootState, selectCountryCode } from '@suite-common/geolocation';
import { type WalletSettingsRootState, selectEnabledNetworks } from '@suite-common/wallet-core';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { selectActiveTransports } from './suiteSelectors';
import { type SuiteRootState } from '../../reducers/suite/suiteReducer';

type MessageSystemValidationState = DeviceRootState &
    SuiteRootState &
    TorRootState &
    WalletSettingsRootState &
    GeolocationRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<MessageSystemValidationState>();

export const selectMessageSystemValidationParams = createMemoizedSelector(
    [
        selectSelectedDevice,
        selectActiveTransports,
        selectIsTorEnabled,
        selectEnabledNetworks,
        selectCountryCode,
    ],
    (device, transports, tor, enabledNetworks, countryCode) => ({
        device,
        transports,
        settings: {
            tor,
            enabledNetworks,
        },
        countryCode,
    }),
);
