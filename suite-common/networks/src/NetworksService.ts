import type { NetworkModule, NetworkType } from '@network-module/suite-types';

export type NetworksService = {
    networkModules: Map<NetworkType, NetworkModule>;
};

export type NetworksServiceDep = {
    networks: NetworksService;
};
