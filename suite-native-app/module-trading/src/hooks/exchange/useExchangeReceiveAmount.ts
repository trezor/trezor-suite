import type { ExchangeTrade } from 'invity-api';

import { getSimulatedReceiveAmount } from '@suite-common/trading';

import { useDexExchangeTxSimulation } from './useDexExchangeTxSimulation';

export const useExchangeReceiveAmount = (quote: ExchangeTrade | undefined) => {
    const { isLoading, data: simulationResult } = useDexExchangeTxSimulation();
    const simulatedReceiveAmount = getSimulatedReceiveAmount(simulationResult, quote?.receive);

    return {
        isLoading,
        receiveAmount: simulatedReceiveAmount ?? quote?.receiveStringAmount,
    };
};
