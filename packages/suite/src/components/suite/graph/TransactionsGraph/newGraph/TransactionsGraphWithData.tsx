import { selectLocalCurrency } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Text } from '@trezor/components';

import { TransactionsGraph } from './TransactionsGraph';
import { useFetchFiatRates } from './useFetchFiatRates';
import { useFetchStartBalance } from './useFetchStartBalance';
import { getBalanceGraphData } from './utils';
import { useSelector } from '../../../../../hooks/suite';
import { GraphRange } from '../../../../../types/wallet/graph';

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

    const balanceGraphData = getBalanceGraphData({ account, graph });

    const {
        startBalance,
        hasError,
        isLoading: isStartBalanceLoading,
    } = useFetchStartBalance({ account, selectedRange, localCurrency });
    const { fiatRates, isLoading: isFiatRatesLoading } = useFetchFiatRates({
        account,
        selectedRange,
        localCurrency,
    });
    console.log('___', { selectedRange, startBalance, balanceGraphData, fiatRates });

    if (hasError) {
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
