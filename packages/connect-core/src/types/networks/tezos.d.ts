// get address

export interface TezosGetAddress {
    path: string | number[];
    address?: string;
    showOnTrezor?: boolean;
}

export interface TezosAddress {
    address: string;
    path: number[];
    serializedPath: string;
}

// get public key

export interface TezosGetPublicKey {
    path: string | number[];
    showOnTrezor?: boolean;
}

export interface TezosPublicKey {
    publicKey: string;
    path: number[];
    serializedPath: string;
}

// sign transaction

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
    script: string | number[];
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
    path: string | number[];
    branch: string;
    operation: TezosOperation;
}
