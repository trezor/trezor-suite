import type { MMKV } from 'react-native-mmkv';

import { createAddressValidator } from '@suite-common/address';
import {
    createFindNetworkSymbolForProtocol,
    createGetNetworkConfig,
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';
import {
    type CommonServices,
    type ExtraDependencies,
} from '@suite-common/redux-extra-dependencies';
import { extraDependenciesCommonMock } from '@suite-common/test-utils';
import { type NativeAnalyticsDep } from '@suite-native/analytics';
import { mockNativeAnalytics } from '@suite-native/analytics/mocks';
import { type MMKVStorageDep } from '@suite-native/services';

// Importing NativeServices from @suite-native/state would create a package cycle: state depends on
// feature packages whose tests depend on test-utils. Keep the same explicit service contract here.
type NativeServices = CommonServices & NativeAnalyticsDep & MMKVStorageDep;

const networkModules = createNetworksCompositionRoot();
const networkModuleRepository = createNetworkModuleRepository({ networkModules });
const getNetworkConfig = createGetNetworkConfig({ networkModuleRepository });
const findNetworkSymbolForProtocol = createFindNetworkSymbolForProtocol({
    getNetworkConfig,
    networkModuleRepository,
});
const addressValidator = createAddressValidator({ networkModuleRepository });

export const extraDependenciesNativeMock: ExtraDependencies & { services: NativeServices } = {
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
