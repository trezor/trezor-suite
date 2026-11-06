import { type TokenSymbol } from '@suite-common/tokens';

export type EarnTokenBalance = {
    value: string;
    symbol: TokenSymbol;
    contractAddress?: string | null;
    decimals?: number;
};
