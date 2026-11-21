import { useEffect, useMemo, useReducer, useState } from 'react';
import { useWatch } from 'react-hook-form';

import {
    type TronStakeStepId,
    composeTronClaimFeeLevelsThunk,
    composeTronFreezeFeeLevelsThunk,
    composeTronUnstakeFeeLevelsThunk,
    composeTronVoteFeeLevelsThunk,
    composeTronWithdrawFeeLevelsThunk,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { type Account, type FeeInfo, type PrecomposedLevels } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';
import { BigNumber } from '@trezor/utils';

import { useSelector } from '#src/hooks/suite/useSelector';

import { type useTronStakeForm } from './useTronStakeForm';
import { parseVoteAllocations } from '../utils/voteUtils';

interface TronStakeFees {
    feeInfo: FeeInfo;
    composedLevels: PrecomposedLevels | undefined;
    hasError: boolean;
    retry: () => void;
}

interface UseTronStakeFeesProps {
    account: Account;
    form: ReturnType<typeof useTronStakeForm>;
    step: TronStakeStepId;
}

export const useTronStakeFees = ({ account, form, step }: UseTronStakeFeesProps): TronStakeFees => {
    const { dispatch } = useServices(injectDispatch);
    const [amount, resourceType, voteAllocations] = useWatch({
        control: form.methods.control,
        name: ['amount', 'resourceType', 'voteAllocations'],
    });
    const isAmountStep = step === 'freeze' || step === 'unstake';
    const composeAmount = isAmountStep ? amount : '';
    const composeResourceType = isAmountStep ? resourceType : 'bandwidth';
    const composeVoteAllocations = step === 'vote' ? voteAllocations : undefined;

    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));
    const feeInfo = useMemo(
        () =>
            getConvertedOrDefaultFeeInfo({ networkType: account.networkType, feeInfo: rawFeeInfo }),
        [account.networkType, rawFeeInfo],
    );

    const composeLevels = useMemo(() => {
        const amountValue = new BigNumber(composeAmount);
        if (isAmountStep && (!amountValue.isFinite() || amountValue.lte(0))) {
            return undefined;
        }

        switch (step) {
            case 'freeze':
                return () =>
                    dispatch(
                        composeTronFreezeFeeLevelsThunk({
                            account,
                            amount: composeAmount,
                            resourceType: composeResourceType,
                        }),
                    )
                        .unwrap()
                        .catch(() => undefined);
            case 'vote': {
                const allocations = parseVoteAllocations(composeVoteAllocations ?? []);

                if (allocations.length === 0) {
                    return undefined;
                }

                return () =>
                    dispatch(composeTronVoteFeeLevelsThunk({ account, allocations }))
                        .unwrap()
                        .catch(() => undefined);
            }
            case 'unstake':
                return () =>
                    dispatch(
                        composeTronUnstakeFeeLevelsThunk({
                            account,
                            amount: composeAmount,
                            resourceType: composeResourceType,
                        }),
                    )
                        .unwrap()
                        .catch(() => undefined);
            case 'withdraw':
                return () =>
                    dispatch(composeTronWithdrawFeeLevelsThunk({ account }))
                        .unwrap()
                        .catch(() => undefined);
            case 'claim':
                return () =>
                    dispatch(composeTronClaimFeeLevelsThunk({ account }))
                        .unwrap()
                        .catch(() => undefined);
            case 'complete':
                return undefined;
            default:
                return exhaustive(step);
        }
    }, [
        step,
        account,
        composeAmount,
        composeResourceType,
        composeVoteAllocations,
        dispatch,
        isAmountStep,
    ]);

    const [attempt, retry] = useReducer((previous: number) => previous + 1, 0);
    const [composition, setComposition] = useState<{
        request: typeof composeLevels;
        attempt: number;
        levels: PrecomposedLevels | undefined;
    }>();

    useEffect(() => {
        if (!composeLevels) {
            return;
        }

        let active = true;

        void composeLevels().then(levels => {
            if (active) {
                setComposition({ request: composeLevels, attempt, levels });
            }
        });

        return () => {
            active = false;
        };
    }, [composeLevels, attempt]);

    const isCurrent = composition?.request === composeLevels && composition?.attempt === attempt;
    const composedLevels = isCurrent ? composition?.levels : undefined;
    const hasError = !!composeLevels && isCurrent && composedLevels === undefined;

    return { feeInfo, composedLevels, hasError, retry };
};
