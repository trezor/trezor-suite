import {
    type GetPositionParams,
    type StakingPosition,
    type StakingProductAdapter,
    type StakingProductId,
    type StakingWithdrawalBalances,
    assertStakingPosition,
    stakingAmountSchema,
} from '@suite-common/earn-staking-common';
import type { QueryClientDep } from '@suite-common/react-query';
import {
    type AccountsRootState,
    type TransactionsRootState,
    selectAccountByKey,
    selectAccountTransactions,
    selectAccounts,
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
    selectStakingPosition,
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
    async ({ accountKey }, { dispatch, getState, extra }) => {
        const account = selectAccountByKey(getState(), accountKey);

        if (!account) return;

        const adapters = extra.services.staking.stakingProductRepository.listBySymbol(
            account.symbol,
        );

        const syncPositions = (
            withdrawals: ReadonlyMap<StakingProductId, StakingWithdrawalBalances>,
        ) => {
            const transactions = selectAccountTransactions(getState(), accountKey);
            const positions = adapters.flatMap(adapter => {
                const withdrawalBalances = withdrawals.get(adapter.descriptor.id);
                const position = getAdapterPosition(adapter, {
                    account,
                    productInfo: getCachedStakingProductInfo(
                        extra.services.queryClient,
                        adapter.descriptor.id,
                    ),
                    transactions,
                    ...(withdrawalBalances && { withdrawalBalances }),
                });

                if (position === null) return [];
                assertStakingPosition(position);

                return [position];
            });

            dispatch(stakingActions.positionsSynced({ accountKey, positions }));
        };

        const withdrawals = new Map<StakingProductId, StakingWithdrawalBalances>();
        const remoteAdapters = adapters.filter(
            adapter => adapter.fetchWithdrawalBalances !== undefined,
        );

        for (const {
            descriptor: { id },
        } of remoteAdapters) {
            const previous = selectStakingPosition(getState(), accountKey, id);
            if (previous !== null) withdrawals.set(id, previous.balances);
        }
        syncPositions(withdrawals);

        if (remoteAdapters.length === 0) return;

        await Promise.all(
            remoteAdapters.map(async adapter => {
                const { id } = adapter.descriptor;
                try {
                    const balances = await adapter.fetchWithdrawalBalances?.(account);

                    if (balances !== undefined) {
                        withdrawals.set(id, {
                            unstaking: stakingAmountSchema.parse(balances.unstaking),
                            withdrawable: stakingAmountSchema.parse(balances.withdrawable),
                        });
                    }
                } catch {
                    // Keep the last known withdrawal balances if the adapter cannot refresh them.
                }
            }),
        );

        if (selectAccountByKey(getState(), accountKey) === account) {
            syncPositions(withdrawals);
        }
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

export type RefreshStakingProductInfoParams = {
    force?: boolean;
};

export type RefreshStakingProductInfoThunkState = SyncAllStakingPositionsThunkState;

export type RefreshStakingProductInfoThunkDeps = SyncAllStakingPositionsThunkDeps;

export const refreshStakingProductInfoThunk = createThunk<
    void,
    RefreshStakingProductInfoParams | undefined,
    { state: RefreshStakingProductInfoThunkState; extra: RefreshStakingProductInfoThunkDeps }
>(
    `${STAKING_MODULE_PREFIX}/refreshStakingProductInfo`,
    async (params, { dispatch, getState, extra }) => {
        const { queryClient, staking } = extra.services;

        // Every product serves the promo lists, whatever the enabled networks, testnets included.
        const descriptors = selectStakingProductDescriptors(getState());
        const networkSymbols = [...new Set(descriptors.map(({ networkSymbol }) => networkSymbol))];

        const refreshProductInfo = async (productId: StakingProductId): Promise<boolean> => {
            const previousInfo = getCachedStakingProductInfo(queryClient, productId);

            try {
                await queryClient.query({
                    ...getStakingProductInfoQueryOptions({
                        stakingProductRepository: staking.stakingProductRepository,
                        productId,
                    }),
                    staleTime: params?.force === true ? 0 : PRODUCT_INFO_MAX_AGE_MS,
                });

                return getCachedStakingProductInfo(queryClient, productId) !== previousInfo;
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Unknown error';

                console.warn(`Staking product info for ${productId} failed: ${message}`);

                return false;
            }
        };

        // Each network re-syncs once its own products are refreshed, never waiting for another.
        await Promise.all(
            networkSymbols.map(async networkSymbol => {
                const changes = await Promise.all(
                    descriptors
                        .filter(descriptor => descriptor.networkSymbol === networkSymbol)
                        .map(({ id }) => refreshProductInfo(id)),
                );

                if (changes.some(Boolean)) {
                    await dispatch(syncAllStakingPositionsThunk({ networkSymbol }));
                }
            }),
        );
    },
);
