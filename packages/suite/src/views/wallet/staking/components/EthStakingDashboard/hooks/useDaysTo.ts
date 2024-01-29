import { useMemo } from 'react';
import { useSelector } from 'src/hooks/suite';
import {
    selectAccountStakeTransactions,
    selectAccountUnstakeTransactions,
} from '@suite-common/wallet-core';
import { ValidatorsQueueState } from 'src/types/wallet/stake';

const secondsToDays = (seconds: number) => Math.round(seconds / 60 / 60 / 24);

interface UseDaysToParams {
    validatorsQueue: ValidatorsQueueState;
    selectedAccountKey: string;
}

export const useDaysTo = ({ selectedAccountKey, validatorsQueue }: UseDaysToParams) => {
    const stakeTxs = useSelector(state =>
        selectAccountStakeTransactions(state, selectedAccountKey || ''),
    );
    const daysToAddToPool = useMemo(() => {
        const lastTx = stakeTxs[0];

        if (!lastTx?.blockTime) return 1;

        const sevenDays = 7 * 24 * 60 * 60;
        const now = Math.floor(Date.now() / 1000);
        const secondsToWait =
            lastTx.blockTime +
            validatorsQueue.validatorAddingDelay +
            validatorsQueue.validatorActivationTime +
            sevenDays -
            now;
        const daysToWait = secondsToDays(secondsToWait);

        return daysToWait <= 0 ? 1 : daysToWait;
    }, [stakeTxs, validatorsQueue.validatorActivationTime, validatorsQueue.validatorAddingDelay]);

    const unstakeTxs = useSelector(state =>
        selectAccountUnstakeTransactions(state, selectedAccountKey),
    );
    const daysToUnstake = useMemo(() => {
        const lastTx = unstakeTxs[0];

        if (!lastTx?.blockTime) return 1;

        const now = Math.floor(Date.now() / 1000);
        const secondsToWait = lastTx.blockTime + validatorsQueue.validatorWithdrawTime - now;
        const daysToWait = secondsToDays(secondsToWait);

        return daysToWait <= 0 ? 1 : daysToWait;
    }, [unstakeTxs, validatorsQueue.validatorWithdrawTime]);

    return {
        daysToAddToPool,
        daysToUnstake,
    };
};
