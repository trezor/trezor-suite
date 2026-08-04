import {
    createGetNetworkConfig,
    createNetworkModuleRepository,
    createNetworksCompositionRoot,
} from '@suite-common/networks';

import type { NetworkConfigDeps } from '../src/networksConfig';

const networkModules = createNetworksCompositionRoot();
const networkModuleRepository = createNetworkModuleRepository({ networkModules });
const getNetworkConfig = createGetNetworkConfig({ networkModuleRepository });

export const mockNetworkConfigDeps: NetworkConfigDeps = {
    getNetworkConfig,
    networkModuleRepository,
};
