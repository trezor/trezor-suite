import type { NetworkModule } from '@network-module/suite-types';

import type { NetworkType } from '@suite-common/wallet-config';

export type NetworksService = {
    networkModules: Map<NetworkType, NetworkModule>;
};

export type NetworksServiceDep = {
    networks: NetworksService;
};
