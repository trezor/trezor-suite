import * as BufferLayout from '@solana/buffer-layout';
import type { TokenAccount } from '@trezor/blockchain-link-types';
import { A, F, pipe } from '@mobily/ts-belt';
import { getLamportsFromSol } from '@suite-common/wallet-utils';
import {
    TOKEN_PROGRAM_PUBLIC_KEY,
    ASSOCIATED_TOKEN_PROGRAM_PUBLIC_KEY,
    SYSTEM_PROGRAM_PUBLIC_KEY,
} from '@trezor/blockchain-link-utils/lib/solana';
import BigNumber from 'bignumber.js';

const loadSolanaLib = async () => {
    const lib = await import('@solana/web3.js');

    return lib;
};

export const getPubKeyFromAddress = async (address: string) => {
    const { PublicKey } = await loadSolanaLib();

    return new PublicKey(address);
};
