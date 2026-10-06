import { type PayloadAction } from '@reduxjs/toolkit';

import { deviceActions } from '@suite-common/device';
import {
    type ActionTypesDep,
    type ReducersDep,
    createSliceWithExtraDeps,
} from '@suite-common/redux-utils';
import { type AccountKey, type EarnOpportunityKey } from '@suite-common/wallet-types';

import { accountsActions } from './accountsActions';

type EarnOpportunity =
    { type: 'staking'; provider: string } | { type: 'yield'; vaultAddress: string };

export const getEarnOpportunityKey = (opportunity: EarnOpportunity): EarnOpportunityKey =>
    opportunity.type === 'staking'
        ? `staking:${opportunity.provider}`
        : `yield:${opportunity.vaultAddress.toLowerCase()}`;

export const getYieldEarnOpportunityKey = (
    vaultAddress: string | null | undefined,
): EarnOpportunityKey | undefined =>
    vaultAddress ? getEarnOpportunityKey({ type: 'yield', vaultAddress }) : undefined;

export type EarnOnboardingState = Record<AccountKey, EarnOpportunityKey[]>;

export const earnOnboardingInitialState: EarnOnboardingState = {};

export type EarnOnboardingRootState = {
    wallet: {
        earnOnboarding: EarnOnboardingState;
    };
};

export type EarnOnboardingSliceDeps = ActionTypesDep<'storageLoad'> &
    ReducersDep<'storageLoadEarnOnboarding'>;

type ConfirmEarnOnboardingPayload = {
    accountKey: AccountKey;
    opportunity: EarnOpportunityKey;
};

const earnOnboardingSlice = createSliceWithExtraDeps({
    name: 'earnOnboarding',
    initialState: earnOnboardingInitialState,
    reducers: {
        confirmEarnOnboarding: (
            state: EarnOnboardingState,
            { payload }: PayloadAction<ConfirmEarnOnboardingPayload>,
        ) => {
            const confirmed = state[payload.accountKey] ?? [];

            if (confirmed.includes(payload.opportunity)) return;

            state[payload.accountKey] = [...confirmed, payload.opportunity];
        },
    },
    extraReducers: (builder, extra: EarnOnboardingSliceDeps) => {
        builder
            .addCase(accountsActions.removeAccount, (state, { payload }) => {
                payload.forEach(account => {
                    delete state[account.key];
                });
            })
            .addCase(deviceActions.setRememberDevice, state => ({ ...state }))
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadEarnOnboarding);
    },
});

export const earnOnboardingActions = earnOnboardingSlice.actions;
export const prepareEarnOnboardingReducer = earnOnboardingSlice.prepareReducer;

export const selectConfirmedEarnOpportunities = (
    state: EarnOnboardingRootState,
    accountKey: AccountKey,
): EarnOpportunityKey[] | undefined => state.wallet.earnOnboarding[accountKey];

export const selectIsEarnOnboardingConfirmed = (
    state: EarnOnboardingRootState,
    accountKey: AccountKey | undefined,
    opportunity: EarnOpportunityKey | undefined,
): boolean =>
    !!accountKey &&
    !!opportunity &&
    !!selectConfirmedEarnOpportunities(state, accountKey)?.includes(opportunity);
