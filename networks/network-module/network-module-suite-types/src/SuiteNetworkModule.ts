import type { SignVerifyCapability } from './SignVerifyCapability';

export type SuiteNetworkModule<TSymbol extends string = string> = {
    signVerify: SignVerifyCapability;

    getSupportedNetworks: () => readonly TSymbol[];

    isSupportedNetwork: (symbol: string) => symbol is TSymbol;
};
