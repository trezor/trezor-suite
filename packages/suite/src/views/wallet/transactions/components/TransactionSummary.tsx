import styled from 'styled-components';
import { getUnixTime } from 'date-fns';

import { calcTicks, calcTicksFromData } from '@suite-common/suite-utils';
import { variables, Button, Card, Row, Column } from '@trezor/components';

import { Account } from 'src/types/wallet';
import {
    GraphRangeSelector,
    HiddenPlaceholder,
    TransactionsGraph,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { getGraphDataForInterval, updateGraphData } from 'src/actions/wallet/graphActions';
import { aggregateBalanceHistory, getMinMaxValueFromData } from 'src/utils/wallet/graph';
import { selectLocalCurrency } from 'src/reducers/wallet/settingsReducer';

import { TransactionSummaryDropdown } from './TransactionSummaryDropdown';
import { SummaryCards } from './SummaryCards';

const ErrorMessage = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 240px;
    padding: 20px;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
`;

interface TransactionSummaryProps {
    account: Account;
}

export const TransactionSummary = ({ account }: TransactionSummaryProps) => {
    const selectedRange = useSelector(state => state.wallet.graph.selectedRange);
    const graph = useSelector(state => state.wallet.graph);

    const localCurrency = useSelector(selectLocalCurrency);
    const dispatch = useDispatch();

    const intervalGraphData = getGraphDataForInterval({ account, graph });
    const data = intervalGraphData[0]?.data
        ? aggregateBalanceHistory(intervalGraphData, selectedRange.groupBy, 'account')
        : [];

    if (account.networkType === 'ripple') {
        return null;
    }

    const error = intervalGraphData[0]?.error ?? false;
    const isLoading = intervalGraphData[0]?.isLoading ?? false;

    // aggregate values from shown graph data
    const minMaxValues = getMinMaxValueFromData(
        data,
        'account',
        d => d.sent,
        d => d.received,
        d => d.balance,
    );

    const xTicks =
        selectedRange.label === 'all'
            ? calcTicksFromData(data).map(getUnixTime)
            : calcTicks(selectedRange.startDate, selectedRange.endDate).map(getUnixTime);

    // Interval shown in InfoCard below the graph
    // For 'all' range pick first and last datapoint's timestamps
    // For other intervals do same date calculation as in calcTicks func
    const dataInterval: [number, number] =
        selectedRange.label === 'all'
            ? [
                  intervalGraphData[0]?.data[0]?.time,
                  intervalGraphData[0]?.data[intervalGraphData[0].data.length - 1]?.time,
              ]
            : [getUnixTime(selectedRange.startDate), getUnixTime(selectedRange.endDate)];

    const onRefresh = () => dispatch(updateGraphData([account]));
    const onSelectedRange = () => dispatch(updateGraphData([account], { newAccountsOnly: true }));

    return (
        <Column alignItems="stretch" gap={20}>
            {account.networkType !== 'solana' && (
                <>
                    <Row justifyContent="space-between" alignItems="center">
                        <GraphRangeSelector onSelectedRange={onSelectedRange} align="bottom-left" />
                        <TransactionSummaryDropdown />
                    </Row>

                    <Column alignItems="stretch">
                        {error ? (
                            <Card>
                                <Row height={320} overflow="visible" alignItems="stretch">
                                    <ErrorMessage>
                                        <Translation id="TR_COULD_NOT_RETRIEVE_DATA" />
                                        <Button
                                            onClick={onRefresh}
                                            icon="refresh"
                                            variant="tertiary"
                                        >
                                            <Translation id="TR_RETRY" />
                                        </Button>
                                    </ErrorMessage>
                                </Row>
                            </Card>
                        ) : (
                            <HiddenPlaceholder enforceIntensity={8}>
                                <Card>
                                    <Row height={320} overflow="visible" alignItems="stretch">
                                        <TransactionsGraph
                                            hideToolbar
                                            variant="one-asset"
                                            xTicks={xTicks}
                                            account={account}
                                            isLoading={isLoading}
                                            data={data}
                                            minMaxValues={minMaxValues}
                                            localCurrency={localCurrency}
                                            onRefresh={onRefresh}
                                            selectedRange={selectedRange}
                                            receivedValueFn={data => data.received}
                                            sentValueFn={data => data.sent}
                                            balanceValueFn={data => data.balance}
                                        />
                                    </Row>
                                </Card>
                            </HiddenPlaceholder>
                        )}
                    </Column>
                </>
            )}
            <SummaryCards
                selectedRange={selectedRange}
                dataInterval={dataInterval}
                data={data}
                localCurrency={localCurrency}
                account={account}
                isLoading={isLoading}
            />
        </Column>
    );
};
