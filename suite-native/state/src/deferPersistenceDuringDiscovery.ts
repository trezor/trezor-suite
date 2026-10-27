import { type DiscoveryRootState, isDiscoveryInProgress } from '@suite-common/wallet-core';
import { type DeferrablePersistStorageDep, deferPersistWritesWhile } from '@suite-native/storage';

import { type NativeReduxStoreDep } from './createReduxStore';

type DeferPersistenceDuringDiscoveryDeps = NativeReduxStoreDep & DeferrablePersistStorageDep;

const selectIsAnyDiscoveryInProgress = (state: DiscoveryRootState) =>
    Object.values(state.wallet.discovery).some(isDiscoveryInProgress);

/**
 * Discovery updates accounts and transactions many times in a row, and every update would
 * serialize and write the whole persisted wallet. The writes are deferred while any discovery
 * runs and done once when it ends.
 */
export const deferPersistenceDuringDiscovery = (deps: DeferPersistenceDuringDiscoveryDeps) =>
    deferPersistWritesWhile(deps, { shouldDeferWrites: selectIsAnyDiscoveryInProgress });
