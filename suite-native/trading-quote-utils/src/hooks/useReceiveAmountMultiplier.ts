import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectTradingMaxSlippagePercentage } from '@suite-common/trading';
import { BigNumber } from '@trezor/utils';

export const useReceiveAmountMultiplier = () => {
    const maxSlippage = useSelector(selectTradingMaxSlippagePercentage);

    return useCallback(
        (amount: string) => {
            const receiveAmountMultiplier = (100 - Number(maxSlippage)) / 100;

            return BigNumber(amount).multipliedBy(receiveAmountMultiplier).toString();
        },
        [maxSlippage],
    );
};
