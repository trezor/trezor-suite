import type { AddressValidator } from './AddressValidator';
import type { Protocol } from './Protocol';

export type NetworkColor = `#${string}`;

export type SuiteCommonNetworkConfig = {
    readonly color: NetworkColor;
    readonly protocols: readonly Protocol[];
};

export type SuiteCommonNetworkModule<TSymbol extends string> = {
    addressValidator: AddressValidator<TSymbol>;

    getSupportedNetworks: () => readonly TSymbol[];

    isSupportedNetwork: (symbol: string) => symbol is TSymbol;

    getNetworkConfig(symbol: TSymbol): SuiteCommonNetworkConfig;
};
