import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import { createNarrowComponent } from '@trezor/network-module-types';

import type { SignVerify } from './SignVerify';
import type { SuiteNativeNetworkModule } from './SuiteNativeNetworkModule';

export type NetworkModuleSuiteNativeDefinition<TNetworkSymbol extends string> = {
    signVerify?: SignVerify<TNetworkSymbol>;
};

export const createNetworkModuleSuiteNative = <
    TSuiteCommonNetworkModule extends SuiteCommonNetworkModule,
    TNetworkSymbol extends string,
>(
    common: TSuiteCommonNetworkModule,
    supportedNetworks: readonly TNetworkSymbol[],
    definition: NetworkModuleSuiteNativeDefinition<NoInfer<TNetworkSymbol>>,
): SuiteNativeNetworkModule<TSuiteCommonNetworkModule> => {
    const narrowComponent = createNarrowComponent(supportedNetworks);

    const networkSignVerify = definition.signVerify;

    return {
        getSupportedNetworks: common.getSupportedNetworks,
        getCommon: () => common,
        signVerify: networkSignVerify
            ? {
                  Component: narrowComponent(networkSignVerify.Component),
              }
            : null,
    };
};
