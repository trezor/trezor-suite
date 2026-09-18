import type { ReactNode } from 'react';

export type NetworkParams<TSymbol extends string = string> = {
    symbol: TSymbol;
    name: string;
    icon?: ReactNode;
};
