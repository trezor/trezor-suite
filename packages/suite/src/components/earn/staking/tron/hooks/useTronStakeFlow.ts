import { type TrxStats, useTronStakingStats } from '@suite-common/earn-staking-api';
import { type UseQueryResult } from '@suite-common/react-query';
import {
    type TronStakeStepId,
    selectTronStakeSession,
    tronStakeActions,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useDispatch, useSelector } from 'src/hooks/suite';

import { useTronStakeForm } from './useTronStakeForm';

export interface TronStakeContextValues {
    account: Account;
    representatives: UseQueryResult<TrxStats>;
    step: TronStakeStepId;
    goToStep: (step: TronStakeStepId) => void;
    form: ReturnType<typeof useTronStakeForm>;
}

interface UseTronStakeFlowProps {
    account: Account;
}

export const useTronStakeFlow = ({ account }: UseTronStakeFlowProps): TronStakeContextValues => {
    const dispatch = useDispatch();
    const { stats } = useTronStakingStats();
    const { step } = useSelector(selectTronStakeSession);
    const form = useTronStakeForm({ account });

    const goToStep = (nextStep: TronStakeStepId) =>
        dispatch(tronStakeActions.goToStep({ step: nextStep }));

    return {
        account,
        representatives: stats,
        step,
        goToStep,
        form,
    };
};
