import type { TokenStandard } from '@trezor/blockchain-link-types';

/** A token an account holds on one chain, in whole units of the token. */
export type ChainTokenBalance = {
    readonly standard: TokenStandard;
    readonly contract: string;
    readonly symbol?: string;
    readonly name?: string;
    readonly decimals: number;
    readonly balance: string;
};
