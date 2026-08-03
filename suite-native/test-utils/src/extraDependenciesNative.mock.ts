import type { MMKV } from 'react-native-mmkv';

import { createAddressValidator } from '@suite-common/address';
import {
    createGetNetworkColor,
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';
import type { ExtraDependenciesStatic } from '@suite-common/redux-utils';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import type { NativeServices } from '@suite-native/services';

type ExtraDependenciesNativeMock = ExtraDependenciesStatic & { services: NativeServices };

const networkModules = createNetworksCompositionRoot();
const networkModuleRepository = createNetworkModuleRepository({ networkModules });
const getNetworkColor = createGetNetworkColor({ networkModuleRepository });
const addressValidator = createAddressValidator({ networkModuleRepository });

export const extraDependenciesNativeMock: ExtraDependenciesNativeMock = {
    ...extraDependenciesCommonMock,
    services: {
        ...extraDependenciesCommonMock.services,
        networkModuleRepository,
        getNetworkColor,
        addressValidator,
        analytics: mockNativeAnalytics(),
        getMMKVStorage: () => Promise.resolve({} as MMKV),
    },
};
