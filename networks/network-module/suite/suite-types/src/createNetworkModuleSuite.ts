import { createElement } from 'react';

import type { SuiteCommonNetworkModule } from '@trezor/network-module-suite-common-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { isArrayMember } from '@trezor/utils';

import type { SignVerify, SignVerifyProps } from './SignVerify';
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
    const isSupportedNetwork = (symbol: string): symbol is TNetworkSymbol =>
        isArrayMember(symbol, supportedNetworks);

    const narrow = (symbol: NetworkSymbol): NetworkSymbol & TNetworkSymbol => {
        if (!isSupportedNetwork(symbol)) {
            throw new Error(
                `Unsupported network symbol: ${symbol}. Supported: ${supportedNetworks.join(', ')}.`,
            );
        }

        return symbol;
    };

    const networkSignVerify = definition.signVerify;
    const signVerify: SignVerify | null = networkSignVerify
        ? {
              ...networkSignVerify,
              Component: ({ account }: SignVerifyProps) =>
                  createElement(networkSignVerify.Component, {
                      account: { ...account, symbol: narrow(account.symbol) },
                  }),
          }
        : null;

    return {
        getSupportedNetworks: common.getSupportedNetworks,
        getCommon: () => common,
        getSignVerify: account => (isSupportedNetwork(account.symbol) ? signVerify : null),
    };
};
