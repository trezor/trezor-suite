import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type TokenAddress } from '@suite-common/wallet-types';

export type TokenInfoEntry = {
    decimals?: number;
    symbol?: string;
    name?: string;
    standard?: string;
    error: boolean;
};

export type TokenInfoState = Partial<
    Record<NetworkSymbol, Partial<Record<TokenAddress, TokenInfoEntry>>>
>;

export type TokenInfoRootState = {
    wallet: {
        tokenInfo: TokenInfoState;
    };
};
