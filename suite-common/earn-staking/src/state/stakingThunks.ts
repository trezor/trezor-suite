import {
    type GetPositionParams,
    type StakingPosition,
    type StakingProductAdapter,
    assertStakingPosition,
} from '@suite-common/earn-staking-common';
import type { QueryClientDep } from '@suite-common/react-query';
import {
    type AccountsRootState,
    type TransactionsRootState,
    type WalletSettingsRootState,
    selectAccountByKey,
    selectAccountTransactions,
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

// Only the product id and the error's name are logged: the error can carry account values.
const getAdapterPosition = (
    adapter: StakingProductAdapter,
    params: GetPositionParams,
): StakingPosition | null => {
    try {
        return adapter.getPosition(params);
    } catch (error) {
        const reason = error instanceof Error ? error.name : 'unknown error';

        console.warn(`Staking position for ${adapter.descriptor.id} failed: ${reason}`);

        return null;
    }
};

type SyncStakingPositionsParams = {
    accountKey: AccountKey;
};

export type SyncStakingPositionsThunkState = StakingRootState &
    AccountsRootState &
    TransactionsRootState;

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

        const transactions = selectAccountTransactions(getState(), accountKey);

        const adapters = extra.services.staking.stakingProductRepository.listBySymbol(
            account.symbol,
        );

        const positions = adapters.flatMap(adapter => {
            const position = getAdapterPosition(adapter, {
                account,
                productInfo: getCachedStakingProductInfo(
                    extra.services.queryClient,
                    adapter.descriptor.id,
                ),
                transactions,
            });

            if (position === null) return [];

            assertStakingPosition(position);

            return [position];
        });

        dispatch(stakingActions.positionsSynced({ accountKey, positions }));
    },
);

type SyncAllStakingPositionsParams = {
    networkSymbol?: NetworkSymbol;
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
            (params?.networkSymbol === undefined || account.symbol === params.networkSymbol) &&
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
            enabledNetworks.includes(descriptor.networkSymbol),
        );
        const changedSymbols = new Set<NetworkSymbol>();

        await Promise.all(
            descriptors.map(async ({ id: productId, networkSymbol }) => {
                const previousInfo = getCachedStakingProductInfo(queryClient, productId);

                try {
                    await queryClient.query({
                        ...getStakingProductInfoQueryOptions({
                            stakingProductRepository: staking.stakingProductRepository,
                            productId,
                        }),
                        staleTime: params?.force === true ? 0 : PRODUCT_INFO_MAX_AGE_MS,
                    });

                    if (getCachedStakingProductInfo(queryClient, productId) !== previousInfo) {
                        changedSymbols.add(networkSymbol);
                    }
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';

                    console.warn(`Staking product info for ${productId} failed: ${message}`);
                }
            }),
        );

        await Promise.all(
            [...changedSymbols].map(networkSymbol =>
                dispatch(syncAllStakingPositionsThunk({ networkSymbol })),
            ),
        );
    },
);
