import type {
    AccountInfo as AccountInfoBase,
    AccountAddresses,
    Utxo as AccountUtxo,
} from '@trezor/blockchain-link/lib/types/common'; // TODO: export from B-L

export type {
    AccountAddresses,
    Utxo as AccountUtxo,
} from '@trezor/blockchain-link/lib/types/common'; // TODO: export from B-L

export type DiscoveryAccountType = 'p2pkh' | 'p2sh' | 'p2tr' | 'p2wpkh';

export interface AccountInfo extends AccountInfoBase {
    path: string;
    legacyXpub?: string; // bitcoin-like descriptor in legacy format (xpub) used by labeling (metadata)
    utxo?: AccountUtxo[]; // bitcoin utxo
}
export interface DiscoveryAccount {
    type: DiscoveryAccountType;
    label: string;
    descriptor: string;
    address_n: number[];
    empty?: boolean;
    balance?: string;
    addresses?: AccountAddresses;
}
export interface FeeLevel {
    label: 'high' | 'normal' | 'economy' | 'low' | 'custom';
    feePerUnit: string;
    blocks: number;
    feeLimit?: string; // eth gas limit
    feePerTx?: string; // fee for BlockchainEstimateFeeParams.request.specific
}

export type SelectFeeLevel =
    | {
          name: string;
          fee: '0';
          disabled: true;
      }
    | {
          name: string;
          fee: string;
          feePerByte: string;
          minutes: number;
          total: string;
      };
