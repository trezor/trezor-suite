import { selectIsTorEnabled } from '@suite/tor';
import { selectSelectedDevice } from '@suite-common/device';
import { selectCountryCode } from '@suite-common/geolocation';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { createWeakMapSelector } from '@trezor/redux-utils';

import { type AppState } from 'src/types/suite';

import { selectActiveTransports } from './suiteSelectors';

const createMemoizedSelector = createWeakMapSelector.withTypes<AppState>();

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
