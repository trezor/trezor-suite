import { selectNetworkConfigDeps } from '@suite-common/networks';
import { useServices } from '@suite-common/dependency-injection';
import type { ExchangeTrade } from 'invity-api';

import { getSimulatedReceiveAmount } from '@suite-common/trading';

import { useDexExchangeTxSimulation } from './useDexExchangeTxSimulation';

export const useExchangeReceiveAmount = (quote: ExchangeTrade | undefined) => {
    const networkConfigDeps = useServices(selectNetworkConfigDeps);

    const { isLoading, data: simulationResult } = useDexExchangeTxSimulation();
    const simulatedReceiveAmount = getSimulatedReceiveAmount(
        networkConfigDeps,
        simulationResult,
        quote?.receive,
    );

    return {
        isLoading,
        receiveAmount: simulatedReceiveAmount ?? quote?.receiveStringAmount,
    };
};
