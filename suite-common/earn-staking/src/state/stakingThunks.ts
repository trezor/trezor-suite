import { assertStakingPosition } from '@suite-common/earn-staking-common';
import type { QueryClientDep } from '@suite-common/react-query';
import {
    type AccountsRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectAccounts,
    selectEnabledNetworks,
} from '@suite-common/wallet-core';
import type { AccountKey } from '@suite-common/wallet-types';
import type { NetworkSymbol } from '@trezor/network-module-types';
import { type WithServices, createThunk } from '@trezor/redux-utils';

import type { StakingDep } from '../stakingServices';
import {
    getCachedStakingProductInfo,
    getStakingProductInfoQueryOptions,
} from './stakingProductInfoQuery';
import { type StakingRootState, stakingActions } from './stakingReducer';
import {
    selectIsStakingSupportedSymbol,
    selectStakingProductDescriptors,
} from './stakingSelectors';

const STAKING_MODULE_PREFIX = '@suite-common/earn-staking/staking';

const PRODUCT_INFO_MAX_AGE_MS = 5 * 60 * 1000;

type SyncStakingPositionsParams = {
    accountKey: AccountKey;
};

export type SyncStakingPositionsThunkState = StakingRootState & AccountsRootState;

export type SyncStakingPositionsThunkDeps = WithServices<StakingDep & QueryClientDep>;

export const syncStakingPositionsThunk = createThunk<
    void,
    SyncStakingPositionsParams,
    { state: SyncStakingPositionsThunkState; extra: SyncStakingPositionsThunkDeps }
>(
    `${STAKING_MODULE_PREFIX}/syncStakingPositions`,
    ({ accountKey }, { dispatch, getState, extra }) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) return;

        const adapters = extra.services.staking.stakingProductRepository.listBySymbol(
            account.symbol,
        );

        const positions = adapters.flatMap(adapter => {
            const position = adapter.getPosition({
                account,
                productInfo: getCachedStakingProductInfo(
                    extra.services.queryClient,
                    adapter.descriptor.id,
                ),
            });

            if (position === null) return [];

            assertStakingPosition(position);

            return [position];
        });

        dispatch(stakingActions.positionsSynced({ accountKey, positions }));
    },
);

type SyncAllStakingPositionsParams = {
    symbol?: NetworkSymbol;
};

export type SyncAllStakingPositionsThunkState = SyncStakingPositionsThunkState;

export type SyncAllStakingPositionsThunkDeps = SyncStakingPositionsThunkDeps;

export const syncAllStakingPositionsThunk = createThunk<
    void,
    SyncAllStakingPositionsParams | undefined,
    { state: SyncAllStakingPositionsThunkState; extra: SyncAllStakingPositionsThunkDeps }
>(`${STAKING_MODULE_PREFIX}/syncAllStakingPositions`, async (params, { dispatch, getState }) => {
    const accounts = selectAccounts(getState()).filter(
        account =>
            (params?.symbol === undefined || account.symbol === params.symbol) &&
            selectIsStakingSupportedSymbol(getState(), account.symbol),
    );

    await Promise.all(
        accounts.map(account => dispatch(syncStakingPositionsThunk({ accountKey: account.key }))),
    );
});

type RefreshStakingProductInfoParams = {
    force?: boolean;
};

export type RefreshStakingProductInfoThunkState = SyncAllStakingPositionsThunkState &
    WalletSettingsRootState;

export type RefreshStakingProductInfoThunkDeps = SyncAllStakingPositionsThunkDeps;

export const refreshStakingProductInfoThunk = createThunk<
    void,
    RefreshStakingProductInfoParams | undefined,
    { state: RefreshStakingProductInfoThunkState; extra: RefreshStakingProductInfoThunkDeps }
>(
    `${STAKING_MODULE_PREFIX}/refreshStakingProductInfo`,
    async (params, { dispatch, getState, extra }) => {
        const { queryClient, staking } = extra.services;
        const enabledNetworks = selectEnabledNetworks(getState());
        const descriptors = selectStakingProductDescriptors(getState()).filter(descriptor =>
            enabledNetworks.includes(descriptor.symbol),
        );
        const changedSymbols = new Set<NetworkSymbol>();

        await Promise.all(
            descriptors.map(async ({ id: productId, symbol }) => {
                const previousInfo = getCachedStakingProductInfo(queryClient, productId);

                try {
                    await queryClient.fetchQuery({
                        ...getStakingProductInfoQueryOptions({
                            stakingProductRepository: staking.stakingProductRepository,
                            productId,
                        }),
                        staleTime: params?.force === true ? 0 : PRODUCT_INFO_MAX_AGE_MS,
                    });

                    if (getCachedStakingProductInfo(queryClient, productId) !== previousInfo) {
                        changedSymbols.add(symbol);
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';

                    console.warn(`Staking product info for ${productId} failed: ${message}`);
                }
            }),
        );

        await Promise.all(
            [...changedSymbols].map(symbol => dispatch(syncAllStakingPositionsThunk({ symbol }))),
        );
    },
);
