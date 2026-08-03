import { useSelector } from 'react-redux';

import { selectBaseCurrency } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';

import { useDexExchangeTxSimulation } from './useDexExchangeTxSimulation';
import { useExchangeFiatDeviation } from './useExchangeFiatDeviation';
import { selectTradingExchangeSelectedQuote } from '../selectors/tradingSelectors';
import { type ExchangeIssue, getExchangeIssue } from '../utils/exchange/getExchangeIssue';
import { getSimulatedReceiveAmount } from '../utils/exchange/getSimulatedReceiveAmount';

type UseExchangeIssueParams = {
    account: Account | undefined;
    isEnabled: boolean;
    sourceOrigin: string;
};

type UseExchangeIssueResult = {
    isSimulationEnabled: boolean;
    isSimulationLoading: boolean;
    isSimulation: boolean;
    issue: ExchangeIssue | null;
};

export const useExchangeIssue = ({
    account,
    isEnabled,
    sourceOrigin,
}: UseExchangeIssueParams): UseExchangeIssueResult => {
    const quote = useSelector(selectTradingExchangeSelectedQuote);
    const fiatCurrency = useSelector(selectBaseCurrency);

    const {
        isEnabled: isSimulationEnabled,
        isLoading: isSimulationLoading,
        data: simulationResult,
    } = useDexExchangeTxSimulation({ account, isEnabled, sourceOrigin });

    const simulatedReceiveAmount = getSimulatedReceiveAmount(simulationResult, quote?.receive);

    const fiatDeviation = useExchangeFiatDeviation({
        fiatCurrency,
        receiveAmount: simulatedReceiveAmount ?? quote?.receiveStringAmount,
        receiveCryptoId: quote?.receive,
        sendAmount: quote?.sendStringAmount,
        sendCryptoId: quote?.send,
    });

    const issue = getExchangeIssue({ simulationResult, fiatDeviation });
    const isSimulation = !!simulationResult?.payload;

    return {
        isSimulationEnabled,
        isSimulationLoading,
        isSimulation,
        issue,
    };
};
