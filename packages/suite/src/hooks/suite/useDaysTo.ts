import { useMemo } from 'react';
import { useSelector } from './useSelector';
import {
    selectAccountStakeTransactions,
    selectAccountUnstakeTransactions,
} from '@suite-common/wallet-core';
import { ValidatorsQueue } from '@suite-common/wallet-core/src/stake/stakeTypes';

const secondsToDays = (seconds: number) => Math.round(seconds / 60 / 60 / 24);

interface UseDaysToParams {
    validatorsQueue?: ValidatorsQueue;
    selectedAccountKey: string;
}

export const useDaysTo = ({ selectedAccountKey, validatorsQueue }: UseDaysToParams) => {
    const stakeTxs = useSelector(state =>
        selectAccountStakeTransactions(state, selectedAccountKey || ''),
    );

    const daysToAddToPool = useMemo(() => {
        if (
            validatorsQueue?.validatorAddingDelay === undefined ||
            validatorsQueue?.validatorActivationTime === undefined
        ) {
            return undefined;
        }

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
    }, [stakeTxs, validatorsQueue?.validatorAddingDelay, validatorsQueue?.validatorActivationTime]);

    const unstakeTxs = useSelector(state =>
        selectAccountUnstakeTransactions(state, selectedAccountKey),
    );
    const daysToUnstake = useMemo(() => {
        if (validatorsQueue?.validatorWithdrawTime === undefined) {
            return undefined;
        }

        const lastTx = unstakeTxs[0];

        if (!lastTx?.blockTime) return 1;

        const now = Math.floor(Date.now() / 1000);
        const secondsToWait = lastTx.blockTime + validatorsQueue.validatorWithdrawTime - now;
        const daysToWait = secondsToDays(secondsToWait);

        return daysToWait <= 0 ? 1 : daysToWait;
    }, [unstakeTxs, validatorsQueue?.validatorWithdrawTime]);

    const daysToAddToPoolInitial = useMemo(() => {
        if (
            validatorsQueue?.validatorAddingDelay === undefined ||
            validatorsQueue?.validatorActivationTime === undefined
        ) {
            return undefined;
        }

        const secondsToWait =
            validatorsQueue.validatorAddingDelay + validatorsQueue.validatorActivationTime;
        const daysToWait = secondsToDays(secondsToWait);

        return daysToWait <= 0 ? 1 : daysToWait;
    }, [validatorsQueue?.validatorAddingDelay, validatorsQueue?.validatorActivationTime]);

    return {
        daysToAddToPool,
        daysToUnstake,
        daysToAddToPoolInitial,
    };
};
