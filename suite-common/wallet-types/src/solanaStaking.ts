import { SolanaTx } from '@suite-common/staking-solana';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { Fee } from '@trezor/blockchain-link-types/src/blockbook';

import { Blockchain } from './backend';

export const supportedSolanaNetworkSymbols = ['sol', 'dsol'] as const;

export type SupportedSolanaNetworkSymbols = (typeof supportedSolanaNetworkSymbols)[number];

export type PriorityFees = {
    computeUnitPrice: bigint;
    computeUnitLimit: number;
};

export interface PrepareStakeSolTxParams {
    from: string;
    path: string | number[];
    amount: string;
    symbol: NetworkSymbol;
    selectedBlockchain: Blockchain;
    estimatedFee?: Fee[number];
}

export type PrepareClaimSolTxParams = Omit<PrepareStakeSolTxParams, 'amount'>;

export type PrepareStakeSolTxResponse =
    | {
          success: true;
          tx: SolanaTx;
      }
    | {
          success: false;
          errorMessage: string;
      };
