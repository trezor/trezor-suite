import { type NetworkSymbol } from '@suite-common/wallet-config';

export type AllowanceStepToken = {
    networkSymbol: NetworkSymbol;
    contractAddress: string;
    symbol: string;
    decimals: number;
};
