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
import { type StakingApiRootState, stakingApi } from './stakingApi';
import { type StakingRootState, stakingActions } from './stakingReducer';
import {
    selectIsStakingSupportedSymbol,
    selectStakingProductDescriptors,
    selectStakingProductInfo,
} from './stakingSelectors';

const STAKING_MODULE_PREFIX = '@suite-common/earn-staking/staking';

const PRODUCT_INFO_MAX_AGE_SECONDS = 5 * 60;

type SyncStakingPositionsParams = {
    accountKey: AccountKey;
};

export type SyncStakingPositionsThunkState = StakingRootState &
    StakingApiRootState &
    AccountsRootState;

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

export type RefreshStakingProductInfoThunkState = SyncAllStakingPositionsThunkState &
    WalletSettingsRootState;

export type RefreshStakingProductInfoThunkDeps = WithServices<StakingDep>;

export const refreshStakingProductInfoThunk = createThunk<
    void,
    RefreshStakingProductInfoParams | undefined,
    { state: RefreshStakingProductInfoThunkState; extra: RefreshStakingProductInfoThunkDeps }
>(`${STAKING_MODULE_PREFIX}/refreshStakingProductInfo`, async (params, { dispatch, getState }) => {
    const enabledNetworks = selectEnabledNetworks(getState());
    const descriptors = selectStakingProductDescriptors(getState()).filter(descriptor =>
        enabledNetworks.includes(descriptor.symbol),
    );

    await Promise.all(
        descriptors.map(async ({ id: productId, symbol }) => {
            const previousInfo = selectStakingProductInfo(getState(), productId);
            const result = await dispatch(
                stakingApi.endpoints.getProductInfo.initiate(productId, {
                    subscribe: false,
                    forceRefetch: params?.force === true ? true : PRODUCT_INFO_MAX_AGE_SECONDS,
                }),
            );

            if (result.data !== undefined && result.data !== previousInfo) {
                await dispatch(syncAllStakingPositionsThunk({ symbol }));
            }
        }),
    );
});
