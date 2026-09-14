import { useServices } from '@suite-common/dependency-injection';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { selectNetworkConfigDeps } from '@suite-common/networks';

import { useTxSimulation } from '@suite-common/tx-simulation';
import { type Account } from '@suite-common/wallet-types';

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
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const quote = useSelector(selectTradingExchangeSelectedQuote);

    const action = useMemo(
        () =>
            isEnabled
                ? composeDexTxSimulationAction(networkConfigDeps, {
                      quote,
                      account,
                      sourceOrigin,
                  })
                : null,
        [networkConfigDeps, isEnabled, quote, account, sourceOrigin],
    );

    const simulation = useTxSimulation(action);

    return {
        isEnabled: simulation !== null,
        isLoading: simulation?.txSimulationQuery.isLoading ?? false,
        error: simulation?.txSimulationQuery.error ?? null,
        data: simulation?.txSimulationQuery.data,
    };
};
