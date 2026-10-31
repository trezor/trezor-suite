import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

import {
    Feature,
    type MessageSystemRootState,
    selectIsFeatureEnabled,
} from '@suite-common/message-system';
import { type ExchangeIssue, useExchangeIssue } from '@suite-common/trading';
import { type Account } from '@suite-common/wallet-types';

import { TRADING_DEX_SOURCE_ORIGIN } from 'src/constants/wallet/trading/txSimulation';

type TransactionReviewModalRefreshedQuoteGateProps = {
    account: Account | undefined;
    onSettled: (issue: ExchangeIssue | null) => void;
};

export const TransactionReviewModalRefreshedQuoteGate = ({
    account,
    onSettled,
}: TransactionReviewModalRefreshedQuoteGateProps) => {
    const isTxSimulationFeatureEnabled = useSelector((state: MessageSystemRootState) =>
        selectIsFeatureEnabled(state, Feature.trading.txSimulation, true),
    );
    const { issue, isSimulationLoading } = useExchangeIssue({
        account,
        isEnabled: isTxSimulationFeatureEnabled,
        sourceOrigin: TRADING_DEX_SOURCE_ORIGIN,
    });
    const hasSettledRef = useRef(false);

    useEffect(() => {
        if (isSimulationLoading || hasSettledRef.current) {
            return;
        }

        hasSettledRef.current = true;
        onSettled(issue);
    }, [isSimulationLoading, issue, onSettled]);

    return null;
};
