import { type NetworkSymbol } from '@suite-common/wallet-config';

export const MOBILE_SUPPORTED_STAKING_NETWORKS: readonly NetworkSymbol[] = ['eth'] as const;

export const isMobileSupportedStakingNetwork = (symbol: NetworkSymbol): boolean =>
    MOBILE_SUPPORTED_STAKING_NETWORKS.includes(symbol);

export const CRYPTO_BALANCE_DECIMALS = 5;
export const NETWORK_FEE_WARNING_MULTIPLIER = 4;

export const USER_CANCELLED_ERROR_CODES = [
    'Failure_PinCancelled',
    'Method_Cancel',
    'Failure_ActionCancelled',
] as const;
