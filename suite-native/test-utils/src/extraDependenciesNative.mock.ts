import type { MMKV } from 'react-native-mmkv';

import { createAddressValidator } from '@suite-common/address';
import {
    createFindNetworkSymbolForProtocol,
    createGetNetworkConfig,
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
const getNetworkConfig = createGetNetworkConfig({ networkModuleRepository });
const findNetworkSymbolForProtocol = createFindNetworkSymbolForProtocol({
    getNetworkConfig,
    networkModuleRepository,
});
const addressValidator = createAddressValidator({ networkModuleRepository });

export const extraDependenciesNativeMock: ExtraDependenciesNativeMock = {
    ...extraDependenciesCommonMock,
    services: {
        ...extraDependenciesCommonMock.services,
        networkModuleRepository,
        getNetworkConfig,
        findNetworkSymbolForProtocol,
        addressValidator,
        analytics: mockNativeAnalytics(),
        getMMKVStorage: () => Promise.resolve({} as MMKV),
    },
};
