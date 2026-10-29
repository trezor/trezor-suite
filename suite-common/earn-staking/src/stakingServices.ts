import type { Account, AccountKey } from '@suite-common/wallet-types';
import type { Getter } from '@trezor/dependency-injection';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { StakingProductRepositoryDep } from './repository/createStakingProductRepository';

export type LoadStakingProducts = () => void;

export type LoadStakingProductsDep = {
    loadStakingProducts: LoadStakingProducts;
};

export type GetStakingAccounts = Getter<[], readonly Account[]>;

export type GetStakingAccountByKey = Getter<[accountKey: AccountKey], Account | null>;

export type GetStakingEnabledNetworks = Getter<[], readonly NetworkSymbol[]>;

export type StakingWalletDeps = {
    getAccounts: GetStakingAccounts;
    getAccountByKey: GetStakingAccountByKey;
    getEnabledNetworks: GetStakingEnabledNetworks;
};

export type StakingServices = StakingProductRepositoryDep &
    LoadStakingProductsDep &
    StakingWalletDeps;

export type StakingDep = { staking: StakingServices };
