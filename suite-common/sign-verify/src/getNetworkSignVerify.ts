import { type NetworkModuleRepositoryDep } from '@suite-common/networks';
import { type Account } from '@suite-common/wallet-types';

export const getNetworkSignVerify = (deps: NetworkModuleRepositoryDep, account: Account) =>
    deps.networkModuleRepository.isSupportedNetwork(account.symbol)
        ? deps.networkModuleRepository.get(account.symbol).signVerify
        : undefined;
