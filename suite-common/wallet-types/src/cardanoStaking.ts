export interface PendingStakeTx {
    accountKey: string;
    txid: string;
    ts: number;
}

export interface StakePool {
    hex: string;
    bech32: string;
    live_stake: string;
    saturation: string;
}

export type PoolsResponse = {
    next: StakePool;
    pools: StakePool[];
};

export type ActionAvailability =
    | { status: true; reason?: undefined }
    | { status: false; reason: 'POOL_ID_FETCH_FAIL' | 'TX_NOT_FINAL' | 'UTXO_BALANCE_INSUFFICIENT' }
    | { status: false; reason?: string };

export type CardanoStaking = {
    address: string;
    pendingStakeTx: PendingStakeTx | undefined;
    deviceAvailable: {
        status: boolean;
        reason?: 'DEVICE_LOCK' | 'DEVICE_DISCONNECTED';
    };
    withdrawingAvailable: ActionAvailability;
    delegatingAvailable: ActionAvailability;
    loading: boolean;
    fee?: string;
    deposit?: string;
    registeredPoolId: string | null;
    isStakingOnTrezorPool: boolean | null;
    isFetchError: boolean;
    isCurrentPoolOversaturated: boolean;
    trezorPools: PoolsResponse | undefined;
    isActive: boolean;
    rewards: string;
    delegate(): void;
    withdraw(): void;
    calculateFeeAndDeposit(action: 'delegate' | 'withdrawal'): void;
    error?: string;
};
