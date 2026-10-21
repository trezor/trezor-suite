import {
    type NetworkSymbol,
    type StakingProviderId,
    getEthereumStakingProviderIds,
} from '@suite-common/wallet-config';
import { type PartialRecord } from '@trezor/type-utils';
import { throwError } from '@trezor/utils';

import { everstakeAdapter } from './everstake/everstakeAdapter';
import { type EthereumStakingProviderAdapter } from './types';

export const DEFAULT_ETHEREUM_STAKING_PROVIDER_ID: StakingProviderId = 'everstake';

const ADAPTERS: PartialRecord<StakingProviderId, EthereumStakingProviderAdapter> = {
    everstake: everstakeAdapter,
};

export const findEthereumStakingAdapter = (
    id: StakingProviderId,
): EthereumStakingProviderAdapter | undefined => ADAPTERS[id];

export const getEthereumStakingAdapter = (id: StakingProviderId): EthereumStakingProviderAdapter =>
    findEthereumStakingAdapter(id) ?? throwError(`No Ethereum staking adapter for ${id}`);

export const listEthereumStakingAdapters = (
    symbol: NetworkSymbol,
): EthereumStakingProviderAdapter[] =>
    getEthereumStakingProviderIds(symbol).map(getEthereumStakingAdapter);
