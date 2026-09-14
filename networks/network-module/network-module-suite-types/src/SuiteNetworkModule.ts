import type { SignVerifyModule } from './SignVerifyModule';

export type SuiteNetworkModule<TSymbol extends string> = {
    /** `null` for networks that neither sign nor verify messages. */
    signVerify: SignVerifyModule | null;

    getSupportedNetworks: () => readonly TSymbol[];

    isSupportedNetwork: (symbol: string) => symbol is TSymbol;
};
