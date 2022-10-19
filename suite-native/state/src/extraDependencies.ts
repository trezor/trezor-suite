import { DeepPartial } from '@reduxjs/toolkit';

import { ExtraDependencies } from '@suite-common/redux-utils';
import { extraDependenciesMock } from '@suite-common/test-utils';
import { mergeObject as mergeDeepObject } from '@trezor/utils';
import { enabledNetworks } from '@suite-native/config';

// currently we don't need anything specific for mobile app so we can safely use only mock
// in future we will can replace only some mocked functions with real ones
export const extraDependencies: ExtraDependencies = mergeDeepObject(
    // place real functions here
    {
        selectors: {
            selectEnabledNetworks: () => enabledNetworks,
        },
    } as DeepPartial<ExtraDependencies>,
    extraDependenciesMock,
);
