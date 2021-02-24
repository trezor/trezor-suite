import React, { useState } from 'react';
import styled from 'styled-components';
import { getUnixTime } from 'date-fns';
import { Account } from '@wallet-types';
import { variables, Button, Card } from '@trezor/components';
import { TransactionsGraph, Translation, HiddenPlaceholder } from '@suite-components';
import { calcTicks, calcTicksFromData } from '@suite-utils/date';
import { aggregateBalanceHistory, getMinMaxValueFromData } from '@wallet-utils/graphUtils';
import { useSelector, useActions } from '@suite-hooks';
import { GraphData } from '@wallet-types/graph';
import * as graphActions from '@wallet-actions/graphActions';
import RangeSelector from '@suite-components/TransactionsGraph/components/RangeSelector';
import TransactionSummaryDropdown from './components/TransactionSummaryDropdown';
import SummaryCards from './components/SummaryCards';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const ContentWrapper = styled.div`
    display: flex;
    width: 100%;
    flex-direction: column;
`;

const GraphWrapper = styled(Card)`
    flex-direction: row;
    display: flex;
    padding: 14px 16px;
    height: 320px;
`;

const Actions = styled.div`
    display: flex;
    margin-bottom: 20px;
    justify-content: space-between;
    align-items: center;
`;

const ErrorMessage = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 240px;
    padding: 20px;
    align-items: center;
    justify-content: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${props => props.theme.STROKE_GREY};
    margin: 24px 0px;
`;

interface Props {
    account: Account;
}

const TransactionSummary = ({ account }: Props) => {
    const { graph, localCurrency } = useSelector(state => ({
        graph: state.wallet.graph,
        localCurrency: state.wallet.settings.localCurrency,
    }));
    const { updateGraphData, getGraphDataForInterval } = useActions({
        updateGraphData: graphActions.updateGraphData,
        getGraphDataForInterval: graphActions.getGraphDataForInterval,
    });

    // const { account, graph, getGraphDataForInterval, updateGraphData } = props;

    const { selectedRange } = graph;

    const onRefresh = () => {
        updateGraphData([account]);
    };

    const onSelectedRange = () => {
        updateGraphData([account], { newAccountsOnly: true });
    };

    const intervalGraphData = (getGraphDataForInterval({ account }) as unknown) as GraphData[];
    const [isGraphHidden, setIsGraphHidden] = useState(false);
    const data = intervalGraphData[0]?.data
        ? aggregateBalanceHistory(intervalGraphData, selectedRange.groupBy, 'account')
        : [];

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

    return (
        <Wrapper>
            <Actions>
                <RangeSelector onSelectedRange={onSelectedRange} align="left" />
                <TransactionSummaryDropdown
                    isGraphHidden={isGraphHidden}
                    setIsGraphHidden={setIsGraphHidden}
                />
            </Actions>
            {!isGraphHidden && (
                <ContentWrapper>
                    {error ? (
                        <GraphWrapper>
                            <ErrorMessage>
                                <Translation id="TR_COULD_NOT_RETRIEVE_DATA" />
                                <Button onClick={onRefresh} icon="REFRESH" variant="tertiary">
                                    <Translation id="TR_RETRY" />
                                </Button>
                            </ErrorMessage>
                        </GraphWrapper>
                    ) : (
                        <HiddenPlaceholder intensity={7}>
                            <GraphWrapper>
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
                            </GraphWrapper>
                        </HiddenPlaceholder>
                    )}

                    <SummaryCards
                        selectedRange={selectedRange}
                        dataInterval={dataInterval}
                        data={data}
                        localCurrency={localCurrency}
                        symbol={account.symbol}
                        isLoading={isLoading}
                    />
                </ContentWrapper>
            )}
            <Divider />
        </Wrapper>
    );
};

export default TransactionSummary;
