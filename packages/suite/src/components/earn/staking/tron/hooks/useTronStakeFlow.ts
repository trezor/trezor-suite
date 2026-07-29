import { useEffect } from 'react';

import { type TrxStats, useTronStakingStats } from '@suite-common/earn-staking-api';
import { type UseQueryResult } from '@suite-common/react-query';
import { type TronFlow, tronStakeActions } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useDispatch } from 'src/hooks/suite';

import { useTronAmountInput } from './useTronAmountInput';
import { type TronStakeActions, useTronStakeActions } from './useTronStakeActions';
import { useTronStakeFees } from './useTronStakeFees';
import { useTronStakeForm } from './useTronStakeForm';
import { useTronStakePendingTransactionTracking } from './useTronStakePendingTransactionTracking';

export interface TronStakeContextValues {
    account: Account;
    representatives: UseQueryResult<TrxStats>;
    form: ReturnType<typeof useTronStakeForm>;
    actions: TronStakeActions;
    amountInput: ReturnType<typeof useTronAmountInput>;
    fees: ReturnType<typeof useTronStakeFees>;
}

interface UseTronStakeFlowProps {
    account: Account;
    flow: TronFlow;
}

export const useTronStakeFlow = ({
    account,
    flow,
}: UseTronStakeFlowProps): TronStakeContextValues => {
    const dispatch = useDispatch();
    const { stats } = useTronStakingStats();

    const form = useTronStakeForm({ account, flow });
    const actions = useTronStakeActions({ account, form, flow });
    const fees = useTronStakeFees({ account, form, step: actions.step });

    const { methods } = form;

    const amountInput = useTronAmountInput({ account, methods });

    useTronStakePendingTransactionTracking({ account, flow });

    useEffect(
        () => () => {
            if (actions.step === 'complete') {
                dispatch(tronStakeActions.reset({ accountKey: account.key, flow }));
            }
        },
        [account.key, flow, actions.step, dispatch],
    );

    return {
        account,
        representatives: stats,
        form,
        actions,
        amountInput,
        fees,
    };
};
