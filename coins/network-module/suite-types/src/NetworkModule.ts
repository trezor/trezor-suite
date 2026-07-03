import type { AddressValidator } from './AddressValidator';
import type { ComposeTransactionFeeLevels } from './ComposeTransactionFeeLevels';

export type NetworkModule<TSymbol extends string> = {
    addressValidator: AddressValidator<TSymbol>;

    composeTransactionFeeLevels: ComposeTransactionFeeLevels<string>;

    getSupportedCoins: () => readonly TSymbol[];

    isSupportedCoin: (symbol: string) => symbol is TSymbol;
};
