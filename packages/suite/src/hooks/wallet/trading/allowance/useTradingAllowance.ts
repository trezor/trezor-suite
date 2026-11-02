import { useAllowanceTxTracking } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { type TradingAllowanceContextValue } from './TradingAllowanceContext';
import { useTradingAllowanceState } from './useTradingAllowanceState';

type UseTradingAllowanceParams = {
    account: Account | undefined;
};

export const useTradingAllowance = ({
    account,
}: UseTradingAllowanceParams): TradingAllowanceContextValue => {
    const tx = useAllowanceTxTracking({ accountKey: account?.key ?? null });
    const state = useTradingAllowanceState();

    return {
        tx,
        state,
    };
};
