import type { NetworkIconPaths } from '@trezor/network-assets-types';

import type { NetworkModuleRepositoryDep } from './NetworkModuleRepository';
import type { NetworkSymbol } from './NetworkModules';

export type GetIconPathsDeps = NetworkModuleRepositoryDep;

export type GetIconPaths = (symbol: NetworkSymbol) => NetworkIconPaths;

export type GetIconPathsDep = { getIconPaths: GetIconPaths };

export const createGetIconPaths =
    (deps: GetIconPathsDeps): GetIconPaths =>
    symbol =>
        deps.networkModuleRepository.get(symbol).icon.getIconPaths(symbol);
