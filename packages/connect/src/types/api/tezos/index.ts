import type { DerivationPath } from '../../params';

export interface TezosRevealOperation {
    source: string;
    fee: number;
    counter: number;
    gas_limit: number;
    storage_limit: number;
    public_key: string;
}

export interface TezosManagerTransfer {
    destination: string;
    amount: number;
}

export interface TezosParametersManager {
    set_delegate?: string;
    cancel_delegate?: boolean;
    transfer?: TezosManagerTransfer;
}

export interface TezosTransactionOperation {
    source: string;
    destination: string;
    amount: number;
    counter: number;
    fee: number;
    gas_limit: number;
    storage_limit: number;
    parameters?: number[];
    parameters_manager?: TezosParametersManager;
}

export interface TezosOriginationOperation {
    source: string;
    balance: number;
    delegate?: string;
    script: DerivationPath;
    fee: number;
    counter: number;
    gas_limit: number;
    storage_limit: number;
}

export interface TezosDelegationOperation {
    source: string;
    delegate: string;
    fee: number;
    counter: number;
    gas_limit: number;
    storage_limit: number;
}

export interface TezosOperation {
    reveal?: TezosRevealOperation;
    transaction?: TezosTransactionOperation;
    origination?: TezosOriginationOperation;
    delegation?: TezosDelegationOperation;
}

export interface TezosSignTransaction {
    path: DerivationPath;
    branch: string;
    operation: TezosOperation;
    chunkify?: boolean;
}
