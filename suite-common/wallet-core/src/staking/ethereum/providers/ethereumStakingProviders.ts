import {
    type NetworkSymbol,
    type StakingProviderId,
    getEthereumStakingProviderIds,
} from '@suite-common/wallet-config';
import { throwError } from '@trezor/utils';

import { everstakeAdapter } from './everstake/everstakeAdapter';
import { type EthereumStakingProviderAdapter } from './types';

export const DEFAULT_ETHEREUM_STAKING_PROVIDER_ID: StakingProviderId = 'everstake';

const ADAPTERS: Partial<Record<StakingProviderId, EthereumStakingProviderAdapter>> = {
    everstake: everstakeAdapter,
};

export const getEthereumStakingAdapter = (id: StakingProviderId): EthereumStakingProviderAdapter =>
    ADAPTERS[id] ?? throwError(`No Ethereum staking adapter for ${id}`);

export const listEthereumStakingAdapters = (
    symbol: NetworkSymbol,
): EthereumStakingProviderAdapter[] =>
    getEthereumStakingProviderIds(symbol).map(getEthereumStakingAdapter);
