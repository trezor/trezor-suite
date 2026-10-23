import { useEffect, useMemo, useState } from 'react';

import {
    type TronStakeStepId,
    type TronStakingStepRequest,
    composeTronStakingStepThunk,
    selectRawNetworkFeeInfo,
} from '@suite-common/wallet-core';
import { type Account, type FeeInfo, type PrecomposedLevels } from '@suite-common/wallet-types';
import { getConvertedOrDefaultFeeInfo } from '@suite-common/wallet-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';
import { exhaustive } from '@trezor/type-utils';

import { useSelector } from 'src/hooks/suite';

import { type useTronStakeForm } from './useTronStakeForm';
import { parseVoteAllocations } from '../utils/voteUtils';

interface TronStakeFees {
    feeInfo: FeeInfo;
    composedLevels: PrecomposedLevels | undefined;
}

interface UseTronStakeFeesProps {
    account: Account;
    form: ReturnType<typeof useTronStakeForm>;
    step: TronStakeStepId;
}

export const useTronStakeFees = ({ account, form, step }: UseTronStakeFeesProps): TronStakeFees => {
    const { dispatch } = useServices(injectDispatch);

    const amount = form.methods.watch('amount');
    const resourceType = form.methods.watch('resourceType');
    const voteAllocations = form.methods.watch('voteAllocations');

    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));
    const feeInfo = useMemo(
        () =>
            getConvertedOrDefaultFeeInfo({ networkType: account.networkType, feeInfo: rawFeeInfo }),
        [account.networkType, rawFeeInfo],
    );

    const composeLevels = useMemo(() => {
        const composeStep = (request: TronStakingStepRequest) => () =>
            dispatch(composeTronStakingStepThunk({ account, request }))
                .unwrap()
                .catch(() => undefined);

        switch (step) {
            case 'freeze':
                return composeStep({ type: 'freeze', amount, resourceType });
            case 'vote': {
                const allocations = parseVoteAllocations(voteAllocations);

                if (allocations.length === 0) {
                    return undefined;
                }

                return composeStep({ type: 'vote', allocations });
            }
            case 'unstake':
                return composeStep({ type: 'unstake', amount, resourceType });
            case 'withdraw':
                return composeStep({ type: 'withdraw' });
            case 'claim':
                return composeStep({ type: 'claim' });
            case 'complete':
                return undefined;
            default:
                return exhaustive(step);
        }
    }, [step, account, amount, resourceType, voteAllocations, dispatch]);

    const [composedLevels, setComposedLevels] = useState<PrecomposedLevels | undefined>(undefined);

    useEffect(() => {
        if (!composeLevels) {
            setComposedLevels(undefined);

            return;
        }

        let active = true;

        void composeLevels().then(levels => {
            if (active) {
                setComposedLevels(levels);
            }
        });

        return () => {
            active = false;
        };
    }, [composeLevels]);

    return { feeInfo, composedLevels };
};
