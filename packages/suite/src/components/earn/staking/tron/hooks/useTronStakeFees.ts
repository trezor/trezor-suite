import { useEffect, useMemo, useReducer, useState } from 'react';
import { useWatch } from 'react-hook-form';

import {
    type TronStakeFeeRequest,
    type TronStakeStepId,
    composeTronStakeFeeLevelsThunk,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { type Account, type FeeInfo, type PrecomposedLevels } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

import { type useTronStakeForm } from './useTronStakeForm';
import { getTronStakeFeeRequest } from '../utils/getTronStakeFeeRequest';

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

    const request = useMemo(
        () =>
            getTronStakeFeeRequest(
                step,
                composeAmount,
                composeResourceType,
                composeVoteAllocations,
            ),
        [step, composeAmount, composeResourceType, composeVoteAllocations],
    );
    const [attempt, retry] = useReducer((previous: number) => previous + 1, 0);
    const [composition, setComposition] = useState<{
        account: Account;
        request: TronStakeFeeRequest;
        attempt: number;
        levels: PrecomposedLevels | undefined;
    }>();

    useEffect(() => {
        if (!request) return;

        const estimate = dispatch(composeTronStakeFeeLevelsThunk({ account, request }));
        void estimate.then(result => {
            if (composeTronStakeFeeLevelsThunk.rejected.match(result) && result.meta.aborted)
                return;

            const levels = composeTronStakeFeeLevelsThunk.fulfilled.match(result)
                ? result.payload
                : undefined;
            setComposition({ account, request, attempt, levels });
        });

        return () => estimate.abort();
    }, [account, request, attempt, dispatch]);

    const isCurrent =
        composition?.account === account &&
        composition.request === request &&
        composition.attempt === attempt;
    const composedLevels = isCurrent ? composition.levels : undefined;
    const hasError = isCurrent && composedLevels === undefined;

    return { feeInfo, composedLevels, hasError, retry };
};
