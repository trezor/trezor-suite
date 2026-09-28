import { type NetworkSymbol, type StakingNetworkSymbol } from '@suite-common/wallet-config';
import { isStakingSymbol } from '@suite-common/wallet-utils';

export type MobileStakingSupport = 'manage' | 'view' | 'desktop-only';

const MOBILE_STAKING_SUPPORT: Record<StakingNetworkSymbol, MobileStakingSupport> = {
    eth: 'manage',
    thod: 'manage',
    sol: 'manage',
    dsol: 'manage',
    ada: 'view',
    trx: 'desktop-only',
};

const getStakingNetworkSupport = (symbol: StakingNetworkSymbol): MobileStakingSupport =>
    MOBILE_STAKING_SUPPORT[symbol];

export const getMobileStakingSupport = (symbol: NetworkSymbol): MobileStakingSupport | null =>
    isStakingSymbol(symbol) ? getStakingNetworkSupport(symbol) : null;
