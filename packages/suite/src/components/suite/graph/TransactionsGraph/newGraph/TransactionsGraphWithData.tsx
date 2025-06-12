import { useState } from 'react';

import { selectLocalCurrency } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import { Text } from '@trezor/components';

import { TransactionsGraph } from './TransactionsGraph';
import { getBalanceGraphData } from './utils';
import { getGraphDataForInterval } from '../../../../../actions/wallet/graphActions';
import { useSelector } from '../../../../../hooks/suite';
import { GraphRange } from '../../../../../types/wallet/graph';
import { useGraphData } from '../../../../../views/wallet/transactions/components/useGraphData';

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

    const graphData = useGraphData({
        selectedRange,
        balanceGraphData,
        account,
    });
    if (!graphData || graphData.hasError) {
        return <Text>Error while loading graph</Text>;
    }
    const { data, metaData, segments, verticalSegments, ticks } = graphData;
    console.log('___', { data });

    return (
        <TransactionsGraph
            data={data}
            localCurrency={localCurrency}
            segments={segments}
            verticalSegments={verticalSegments}
            ticks={ticks}
            metaData={metaData}
        />
    );
};
