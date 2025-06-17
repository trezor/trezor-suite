import { selectLocalCurrency } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Text } from '@trezor/components';

import { TransactionsGraph } from './TransactionsGraph';
import { getBalanceGraphData } from './utils';
import { getGraphDataForInterval } from '../../../../../actions/wallet/graphActions';
import { useSelector } from '../../../../../hooks/suite';
import { GraphRange } from '../../../../../types/wallet/graph';
import { useFetchStartBalance } from './useFetchStartBalance';
import { useFetchFiatRates } from './useFetchFiatRates';

type TransactionsGraphWithDataProps = {
    account: Account;
    selectedRange: GraphRange;
};

export const TransactionsGraphWithData = ({
    account,
    selectedRange,
}: TransactionsGraphWithDataProps) => {
    const localCurrency = useSelector(selectLocalCurrency);
    const graph = useSelector(state => state.wallet.graph);

    const intervalGraphData = getGraphDataForInterval({ account, graph });
    const balanceGraphData = getBalanceGraphData(intervalGraphData);

    const {
        startBalance,
        hasError,
        isLoading: isStartBalanceLoading,
    } = useFetchStartBalance({ account, selectedRange });
    const { fiatRates, isLoading: isFiatRatesLoading } = useFetchFiatRates({ selectedRange });

    if (hasError || startBalance === null) {
        return <Text>Error while loading graph</Text>;
    }

    return (
        <TransactionsGraph
            localCurrency={localCurrency}
            selectedRange={selectedRange}
            balanceGraphData={balanceGraphData}
            startBalance={startBalance}
            fiatRates={fiatRates}
            isLoading={isStartBalanceLoading || isFiatRatesLoading}
        />
    );
};
