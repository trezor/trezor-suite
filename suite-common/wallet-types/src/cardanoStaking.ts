import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';

export type CardanoAction =
    'delegate' | 'withdrawal' | 'voteDelegate' | 'voteAbstain' | 'deregister';

export type ActionUnavailableReason =
    | 'COMPOSE_FAILED'
    | 'DREP_DELEGATION_REQUIRED'
    | 'POOL_ID_FETCH_FAIL'
    | 'TX_NOT_FINAL'
    | 'UTXO_BALANCE_INSUFFICIENT'
    | 'UTXO_VALUE_TOO_SMALL';

export type ActionAvailability =
    { status: true; reason?: undefined } | { status: false; reason?: ActionUnavailableReason };

export type CardanoStaking = {
    withdrawingAvailable: ActionAvailability;
    delegatingAvailable: ActionAvailability;
    loading: boolean;
    fee?: string;
    deposit?: string;
    rewards?: string;
    calculateFeeAndDeposit: (action: CardanoAction) => Promise<void>;
    isStakingDisabled: boolean;
};

export const supportedCardanoNetworkSymbols = [
    asNetworkSymbol('ada'),
] as const satisfies NetworkSymbol[];

export type SupportedCardanoNetworkSymbols = (typeof supportedCardanoNetworkSymbols)[number];
