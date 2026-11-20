import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import { createNarrowComponent } from '@trezor/network-module-types';

import type { SignVerify } from './SignVerify';
import type { SuiteNetworkModule } from './SuiteNetworkModule';

export type NetworkModuleSuiteDefinition<TNetworkSymbol extends string> = {
    signVerify?: SignVerify<TNetworkSymbol>;
};

export const createNetworkModuleSuite = <
    TSuiteCommonNetworkModule extends SuiteCommonNetworkModule,
    TNetworkSymbol extends string,
>(
    common: TSuiteCommonNetworkModule,
    supportedNetworks: readonly TNetworkSymbol[],
    definition: NetworkModuleSuiteDefinition<NoInfer<TNetworkSymbol>>,
): SuiteNetworkModule<TSuiteCommonNetworkModule> => {
    const narrowComponent = createNarrowComponent(supportedNetworks);

    const networkSignVerify = definition.signVerify;

    return {
        getSupportedNetworks: common.getSupportedNetworks,
        getCommon: () => common,
        signVerify: networkSignVerify
            ? {
                  title: networkSignVerify.title,
                  Component: narrowComponent(networkSignVerify.Component),
              }
            : null,
    };
};
