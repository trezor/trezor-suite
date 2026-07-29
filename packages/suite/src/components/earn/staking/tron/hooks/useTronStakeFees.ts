import { useEffect, useMemo, useState } from 'react';

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
import { exhaustive } from '@trezor/type-utils';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { resolveVotedRepresentativeAddress } from '../voteUtils';
import { type useTronStakeForm } from './useTronStakeForm';

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
    const dispatch = useDispatch();

    const amount = form.methods.watch('amount');
    const resourceType = form.methods.watch('resourceType');
    const representative = form.methods.watch('representative');
    const customRepresentativeAddress = form.methods.watch('customRepresentativeAddress');

    const rawFeeInfo = useSelector(state => selectRawNetworkFeeInfo(state, account.symbol));
    const feeInfo = useMemo(
        () =>
            getConvertedOrDefaultFeeInfo({ networkType: account.networkType, feeInfo: rawFeeInfo }),
        [account.networkType, rawFeeInfo],
    );

    const composeLevels = useMemo(() => {
        switch (step) {
            case 'freeze':
                return () =>
                    dispatch(composeTronFreezeFeeLevelsThunk({ account, amount, resourceType }))
                        .unwrap()
                        .catch(() => undefined);
            case 'vote': {
                const representativeAddress = resolveVotedRepresentativeAddress({
                    representative,
                    customRepresentativeAddress,
                });

                return () =>
                    dispatch(composeTronVoteFeeLevelsThunk({ account, representativeAddress }))
                        .unwrap()
                        .catch(() => undefined);
            }
            case 'unstake':
                return () =>
                    dispatch(composeTronUnstakeFeeLevelsThunk({ account, amount, resourceType }))
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
        amount,
        resourceType,
        representative,
        customRepresentativeAddress,
        dispatch,
    ]);

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
