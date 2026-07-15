import { useMemo } from 'react';

import { useTxSimulation } from '@suite-common/tx-simulation';
import { type Account } from '@suite-common/wallet-types';

import { useSelector } from './useSelector';
import { selectTradingExchangeSelectedQuote } from '../selectors/tradingSelectors';
import { composeDexTxSimulationAction } from '../utils/exchange/composeDexTxSimulationAction';

type UseDexExchangeTxSimulationParams = {
    account: Account | undefined;
    isEnabled: boolean;
    sourceOrigin: string;
};

export const useDexExchangeTxSimulation = ({
    account,
    isEnabled,
    sourceOrigin,
}: UseDexExchangeTxSimulationParams) => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);

    const action = useMemo(
        () =>
            isEnabled
                ? composeDexTxSimulationAction({
                      quote,
                      account,
                      sourceOrigin,
                  })
                : null,
        [isEnabled, quote, account, sourceOrigin],
    );

    const simulation = useTxSimulation(action);

    return {
        isEnabled: simulation !== null,
        isLoading: simulation?.txSimulationQuery.isLoading ?? false,
        error: simulation?.txSimulationQuery.error ?? null,
        data: simulation?.txSimulationQuery.data,
    };
};
