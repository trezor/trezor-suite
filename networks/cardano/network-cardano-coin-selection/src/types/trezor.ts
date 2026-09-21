import { type CardanoAddressType } from './types';

export interface CardanoInput {
    path: string | number[];
    prev_hash: string;
    prev_index: number;
}

export type CardanoToken = {
    assetNameBytes: string;
    amount: string;
};

export type CardanoAssetGroup = {
    policyId: string;
    tokenAmounts: CardanoToken[];
};

export interface CardanoCertificatePointer {
    blockIndex: number;
    txIndex: number;
    certificateIndex: number;
}

export interface CardanoAddressParameters {
    addressType: CardanoAddressType;
    path: string | number[];
    stakingPath?: string | number[];
    stakingKeyHash?: string;
    certificatePointer?: CardanoCertificatePointer;
}

export type CardanoOutput =
    | {
          addressParameters: CardanoAddressParameters;
          amount: string;
          tokenBundle?: CardanoAssetGroup[];
      }
    | {
          address: string;
          amount: string;
          tokenBundle?: CardanoAssetGroup[];
      };

export enum CardanoTxWitnessType {
    BYRON_WITNESS = 0,
    SHELLEY_WITNESS = 1,
}

export type CardanoSignedTxWitness = {
    type: CardanoTxWitnessType;
    pubKey: string;
    signature: string;
    chainCode?: string | null;
};
