import { assertStakingPosition } from '@suite-common/earn-staking-common';
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
import type { StakingProductEntry } from './stakingProductsReducer';
import { type StakingRootState, stakingActions } from './stakingReducer';
import {
    selectIsStakingSupportedSymbol,
    selectStakingProductDescriptors,
    selectStakingProductEntry,
    selectStakingProductInfo,
} from './stakingSelectors';

const STAKING_MODULE_PREFIX = '@suite-common/earn-staking/staking';

const PRODUCT_INFO_FRESHNESS_MS = 5 * 60 * 1000;

type SyncStakingPositionsParams = {
    accountKey: AccountKey;
};

export type SyncStakingPositionsThunkState = StakingRootState & AccountsRootState;

export type SyncStakingPositionsThunkDeps = WithServices<StakingDep>;

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
                productInfo: selectStakingProductInfo(getState(), adapter.descriptor.id),
            });

            if (position === null) return [];

            assertStakingPosition(position);

            return [position];
        });

        dispatch(stakingActions.positionsSynced({ accountKey, positions }));
    },
    {
        condition: ({ accountKey }, { getState }) => {
            const account = selectAccountByKey(getState(), accountKey);

            return account !== null && selectIsStakingSupportedSymbol(getState(), account.symbol);
        },
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
    const accounts = selectAccounts(getState());

    const filteredAccounts = accounts.filter(
        account =>
            (params?.symbol === undefined || account.symbol === params.symbol) &&
            selectIsStakingSupportedSymbol(getState(), account.symbol),
    );

    await Promise.all(
        filteredAccounts.map(account =>
            dispatch(syncStakingPositionsThunk({ accountKey: account.key })),
        ),
    );
});

type RefreshStakingProductInfoParams = {
    force?: boolean;
};

const isProductInfoStale = (entry: StakingProductEntry, now: number) =>
    entry.infoFetchedAt === null || entry.infoFetchedAt <= now - PRODUCT_INFO_FRESHNESS_MS;

export type RefreshStakingProductInfoThunkState = SyncAllStakingPositionsThunkState &
    WalletSettingsRootState;

export type RefreshStakingProductInfoThunkDeps = WithServices<StakingDep>;

export const refreshStakingProductInfoThunk = createThunk<
    void,
    RefreshStakingProductInfoParams | undefined,
    { state: RefreshStakingProductInfoThunkState; extra: RefreshStakingProductInfoThunkDeps }
>(
    `${STAKING_MODULE_PREFIX}/refreshStakingProductInfo`,
    async (params, { dispatch, getState, extra }) => {
        const enabledNetworks = selectEnabledNetworks(getState());
        const productDescriptors = selectStakingProductDescriptors(getState());

        const now = Date.now();
        const force = params?.force ?? false;

        const staleDescriptors = productDescriptors
            .filter(descriptor => enabledNetworks.includes(descriptor.symbol))
            .filter(descriptor => {
                const entry = selectStakingProductEntry(getState(), descriptor.id);

                return (
                    entry !== null &&
                    entry.infoStatus !== 'loading' &&
                    (force || isProductInfoStale(entry, now))
                );
            });

        await Promise.all(
            staleDescriptors.map(async ({ id: productId, symbol }) => {
                dispatch(stakingActions.productInfoRequested({ productId }));

                try {
                    const info = await extra.services.staking.stakingProductRepository
                        .get(productId)
                        .fetchProductInfo({});

                    dispatch(
                        stakingActions.productInfoFetched({
                            productId,
                            info,
                            fetchedAt: Date.now(),
                        }),
                    );
                    await dispatch(syncAllStakingPositionsThunk({ symbol }));
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';

                    console.warn(`Staking product info for ${productId} failed: ${message}`);
                    dispatch(stakingActions.productInfoFailed({ productId, error: message }));
                }
            }),
        );
    },
);
