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

interface DRep {
    hex: string;
    bech32: string;
}

export interface DRepResponse {
    [key: string]: DRep;
}

export type CardanoAction =
    | 'delegate'
    | 'withdrawal'
    | 'voteDelegate'
    | 'voteAbstain'
    | 'deregister';

export type ActionAvailability =
    | { status: true; reason?: undefined }
    | { status: false; reason: 'POOL_ID_FETCH_FAIL' | 'TX_NOT_FINAL' | 'UTXO_BALANCE_INSUFFICIENT' }
    | { status: false; reason?: string };

export type CardanoStaking = {
    withdrawingAvailable: ActionAvailability;
    delegatingAvailable: ActionAvailability;
    loading: boolean;
    fee?: string;
    deposit?: string;
    isActive?: boolean;
    rewards?: string;
    calculateFeeAndDeposit: (action: CardanoAction) => Promise<void>;
    isStakingDisabled: boolean;
};

export const supportedCardanoNetworkSymbols = ['ada'] as const;

export type SupportedCardanoNetworkSymbols = (typeof supportedCardanoNetworkSymbols)[number];
