import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import {
    TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT,
    selectTradingExchangeSelectedQuoteSwapSlippage,
} from '@suite-common/trading';
import { BigNumber } from '@trezor/utils';

export const useReceiveAmountMultiplier = () => {
    const swapSlippage =
        useSelector(selectTradingExchangeSelectedQuoteSwapSlippage) ??
        TRADING_SETTINGS_MAX_SLIPPAGE_PERCENTAGE_DEFAULT;

    return useCallback(
        (amount: string) => {
            const receiveAmountMultiplier = (100 - Number(swapSlippage)) / 100;

            return BigNumber(amount).multipliedBy(receiveAmountMultiplier).toString();
        },
        [swapSlippage],
    );
};
