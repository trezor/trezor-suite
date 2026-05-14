import { getUnixTime } from 'date-fns';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { calcTicks, calcTicksFromData } from '@suite-common/suite-utils';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Button, Card, Column, Row } from '@trezor/components';
import { typography } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { updateGraphData } from 'src/actions/wallet/graphActions';
import { GraphRangeSelector, HiddenPlaceholder, TransactionsGraph } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type Account } from 'src/types/wallet';
import {
    aggregateBalanceHistory,
    getGraphDataForInterval,
    getMinMaxValueFromData,
} from 'src/utils/wallet/graph';

import { SummaryCards } from './SummaryCards';

const ErrorMessage = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 240px;
    padding: 20px;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm']}
    text-align: center;
`;

interface TransactionSummaryProps {
    account: Account;
}

export const TransactionSummary = ({ account }: TransactionSummaryProps) => {
    const selectedRange = useSelector(state => state.wallet.graph.selectedRange);
    const graph = useSelector(state => state.wallet.graph);

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();

    const intervalGraphData = getGraphDataForInterval({ account, graph });
    const data = intervalGraphData[0]?.data
        ? aggregateBalanceHistory(intervalGraphData, selectedRange.groupBy, 'account')
        : [];

    const error = intervalGraphData[0]?.error ?? false;
    const isLoading = intervalGraphData[0]?.isLoading ?? false;

    // aggregate values from shown graph data
    const minMaxValues = getMinMaxValueFromData(
        data,
        'account',
        d => new BigNumber(d.sent),
        d => new BigNumber(d.received),
        d => new BigNumber(d.balance),
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

    const onRefresh = (abortController?: AbortController) =>
        dispatch(
            updateGraphData({
                accounts: [account],
                abortSignal: abortController?.signal,
            }),
        ).unwrap();
    const onSelectedRange = () =>
        dispatch(
            updateGraphData({
                accounts: [account],
            }),
        );

    return (
        <Column alignItems="stretch" gap={20}>
            {error ? (
                <Card paddingType="none">
                    <Column alignItems="stretch" padding={24} gap={16}>
                        <Row height={320} overflow="visible" alignItems="stretch">
                            <ErrorMessage>
                                <Translation id="TR_COULD_NOT_RETRIEVE_DATA" />
                                <Button
                                    onClick={() => onRefresh()}
                                    iconLeft="repeat"
                                    intent="neutral"
                                    priority="secondary"
                                >
                                    <Translation id="TR_RETRY" />
                                </Button>
                            </ErrorMessage>
                        </Row>
                        <GraphRangeSelector
                            onSelectedRange={onSelectedRange}
                            isLoading={isLoading}
                        />
                    </Column>
                </Card>
            ) : (
                <HiddenPlaceholder enforceIntensity={8}>
                    <Card overflow="visible" paddingType="none">
                        <Column alignItems="stretch" padding={24} gap={16}>
                            <Row height={320} overflow="visible" alignItems="stretch">
                                <TransactionsGraph
                                    variant="one-asset"
                                    xTicks={xTicks}
                                    account={account}
                                    isLoading={isLoading}
                                    data={data}
                                    minMaxValues={[
                                        minMaxValues[0].toNumber(),
                                        minMaxValues[1].toNumber(),
                                    ]}
                                    localCurrency={baseCurrencyCode}
                                    onRefresh={onRefresh}
                                    selectedRange={selectedRange}
                                    receivedValueFn={entry => entry.received}
                                    sentValueFn={entry => entry.sent}
                                    balanceValueFn={entry => entry.balance}
                                />
                            </Row>
                            <GraphRangeSelector
                                onSelectedRange={onSelectedRange}
                                isLoading={isLoading}
                            />
                        </Column>
                    </Card>
                </HiddenPlaceholder>
            )}
            <SummaryCards
                selectedRange={selectedRange}
                dataInterval={dataInterval}
                data={data}
                localCurrency={baseCurrencyCode}
                account={account}
                isLoading={isLoading}
            />
        </Column>
    );
};
