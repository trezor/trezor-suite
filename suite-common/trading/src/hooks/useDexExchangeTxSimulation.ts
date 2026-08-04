import { useMemo } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { useTxSimulation } from '@suite-common/tx-simulation';
import { selectNetworkConfigDeps } from '@suite-common/wallet-config';
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
    const deps = useServices(selectNetworkConfigDeps);

    const action = useMemo(
        () =>
            isEnabled
                ? composeDexTxSimulationAction({
                      ...deps,
                      quote,
                      account,
                      sourceOrigin,
                  })
                : null,
        [account, deps, isEnabled, quote, sourceOrigin],
    );

    const simulation = useTxSimulation(action);

    return {
        isEnabled: simulation !== null,
        isLoading: simulation?.txSimulationQuery.isLoading ?? false,
        error: simulation?.txSimulationQuery.error ?? null,
        data: simulation?.txSimulationQuery.data,
    };
};
