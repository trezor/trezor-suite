import type * as CardanoWasm from '@emurgo/cardano-serialization-lib-nodejs';

import { type CertificateType } from '../constants';
import { type CardanoProtocolParams } from '../protocolParams';

export interface Asset {
    unit: string;
    quantity: string;
}
export interface Utxo {
    address: string;
    txHash: string;
    outputIndex: number;
    amount: Asset[];
}

export interface CardanoCertificatePointer {
    blockIndex: number;
    txIndex: number;
    certificateIndex: number;
}

export interface BaseOutput {
    setMax?: boolean;
    isChange?: boolean;
    assets: Asset[];
}

export interface ExternalOutput extends BaseOutput {
    amount: string;
    address: string;
    setMax?: false;
}

export interface ExternalOutputIncomplete extends BaseOutput {
    amount?: string | undefined;
    address?: string;
    setMax: boolean;
}

export interface ChangeOutput extends BaseOutput {
    amount: string;
    address: string;
    isChange: true;
}

export type FinalOutput = ExternalOutput | ChangeOutput;
export type UserOutput = ExternalOutput | ExternalOutputIncomplete;
export type Output = FinalOutput | ExternalOutputIncomplete;

export interface OutputCost {
    output: CardanoWasm.TransactionOutput;
    outputFee: CardanoWasm.BigNum;
    minOutputAmount: CardanoWasm.BigNum;
}

export enum CardanoAddressType {
    BASE = 0,
    BASE_SCRIPT_KEY = 1,
    BASE_KEY_SCRIPT = 2,
    BASE_SCRIPT_SCRIPT = 3,
    POINTER = 4,
    POINTER_SCRIPT = 5,
    ENTERPRISE = 6,
    ENTERPRISE_SCRIPT = 7,
    BYRON = 8,
    REWARD = 14,
    REWARD_SCRIPT = 15,
}

export enum CardanoDRepType {
    KEY_HASH = 0,
    SCRIPT_HASH = 1,
    ABSTAIN = 2,
    NO_CONFIDENCE = 3,
}

export type DRep =
    | {
          type: CardanoDRepType.KEY_HASH;
          keyHash: string;
      }
    | {
          type: CardanoDRepType.SCRIPT_HASH;
          scriptHash: string;
      }
    | {
          type: CardanoDRepType.ABSTAIN | CardanoDRepType.NO_CONFIDENCE;
          keyHash?: never;
          scriptHash?: never;
      };

export interface CoinSelectionResult {
    tx: { body: string; hash: string; size: number };
    inputs: Utxo[];
    outputs: Output[];
    fee: string;
    totalSpent: string;
    deposit: string;
    withdrawal: string;
    ttl?: number;
    max?: string;
}

export type PrecomposedTransaction =
    | ({
          type: 'final';
          outputs: FinalOutput[];
      } & Omit<CoinSelectionResult, 'outputs'>)
    | ({
          type: 'nonfinal';
      } & Pick<CoinSelectionResult, 'fee' | 'totalSpent' | 'deposit' | 'withdrawal' | 'max'>);

export interface Withdrawal {
    stakeAddress: string;
    amount: string;
}

export type CertificateTypeType = typeof CertificateType;

export interface CertificateStakeRegistration {
    type: CertificateTypeType['STAKE_REGISTRATION'] | CertificateTypeType['STAKE_DEREGISTRATION'];
    stakingKeyHash?: string;
}

export interface CertificateStakeDelegation {
    type: CertificateTypeType['STAKE_DELEGATION'];
    stakingKeyHash?: string;
    pool: string;
}

export interface CertificateStakePoolRegistration {
    type: CertificateTypeType['STAKE_POOL_REGISTRATION'];
    pool_parameters: Record<string, unknown>;
}

export interface CertificateVoteDelegation {
    type: CertificateTypeType['VOTE_DELEGATION'];
    dRep: DRep;
}

export type Certificate =
    | CertificateStakeRegistration
    | CertificateStakeDelegation
    | CertificateStakePoolRegistration
    | CertificateVoteDelegation;

export interface Options {
    /** Overrides; omitted values fall back to `DEFAULT_CARDANO_PROTOCOL_PARAMS`. */
    protocolParams?: Partial<CardanoProtocolParams>;
    debug?: boolean;
    forceLargestFirstSelection?: boolean;
    _maxTokensPerOutput?: number;
}

export interface CoinSelectionParams {
    utxos: Utxo[];
    outputs: UserOutput[];
    changeAddress: string;
    certificates: Certificate[];
    withdrawals: Withdrawal[];
    accountPubKey: string;
    ttl?: number;
}
