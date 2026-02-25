import { NetworkSymbol } from '@suite-common/wallet-config';
import { Blockchain } from '@suite-common/wallet-types';
import { Fee } from '@trezor/blockchain-link-types/src/blockbook';
import type { SolanaSignTransaction } from '@trezor/connect';

export const supportedSolanaNetworkSymbols = ['sol', 'dsol'] as const;

export type SupportedSolanaNetworkSymbols = (typeof supportedSolanaNetworkSymbols)[number];

export type PriorityFees = {
    computeUnitPrice: bigint;
    computeUnitLimit: number;
};

export type TransactionShim = {
    addSignature(signerPubKey: string, signatureHex: string): void;
    serializeMessage(): string;
    serialize(): string;
};

export type SolanaTxMeta = {
    deviceAmountLamports: string;
    feeLamports: string;
    rentLamports: string;
    feeIncludingRentLamports: string;
};

export type SolanaTx = SolanaSignTransaction & {
    txShim: TransactionShim;
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
          solanaTxMeta: SolanaTxMeta;
      }
    | {
          success: false;
          errorMessage: string;
      };

export type EstimatedFee = {
    success: boolean;
    payload?: Fee[number];
};
