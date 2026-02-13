import { TokenSymbol } from '@suite-common/wallet-types';

export type EarnTokenBalance = {
    value: string;
    symbol: TokenSymbol;
    contractAddress?: string | null;
};
