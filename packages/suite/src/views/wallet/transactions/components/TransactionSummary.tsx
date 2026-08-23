import { useState } from 'react';

import { getUnixTime } from 'date-fns';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectHasExperimentalFeature } from '@suite/settings';
import { getGraphFiatCoinId } from '@suite-common/fiat-services';
import { calcTicks, calcTicksFromData } from '@suite-common/suite-utils';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Button, Card, Column, Flex, Row, Switch, Text } from '@trezor/components';
import { RepeatIcon } from '@trezor/icons';
import { breakpoints, typography } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { updateGraphData } from 'src/actions/wallet/graphActions';
import { GraphRangeSelector, HiddenPlaceholder, TransactionsGraph } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import {
    aggregateBalanceHistory,
    getGraphDataForInterval,
    getMinMaxValueFromData,
    isNetworkWithGraphFeature,
} from 'src/utils/wallet/graph';
import { AccountHistoricalFiatGraph } from 'src/views/dashboard/PortfolioCard/AccountHistoricalFiatGraph';

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

const selectGraph = (state: AppState) => state.wallet.graph;

export const TransactionSummary = ({ account }: TransactionSummaryProps) => {
    const graph = useSelector(selectGraph);
    const { selectedRange } = graph;
    const isNewBalanceGraphEnabled = useSelector(selectHasExperimentalFeature('new-balance-graph'));
    const isBelowLaptop = useIsContentBelowBreakpoint(breakpoints.laptop);
    const [showMarkers, setShowMarkers] = useState(true);

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();

    const intervalGraphData = getGraphDataForInterval({ account, graph });
    const isGraphDataLoaded = intervalGraphData.length > 0;
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
            : calcTicks(new Date(selectedRange.startDate), new Date(selectedRange.endDate)).map(
                  getUnixTime,
              );

    // Interval shown in InfoCard below the graph
    // For 'all' range pick first and last datapoint's timestamps
    // For other intervals do same date calculation as in calcTicks func
    const dataInterval: [number | undefined, number | undefined] =
        selectedRange.label === 'all'
            ? [
                  intervalGraphData[0]?.data[0]?.time,
                  intervalGraphData[0]?.data[(intervalGraphData[0]?.data.length ?? 1) - 1]?.time,
              ]
            : [
                  getUnixTime(new Date(selectedRange.startDate)),
                  getUnixTime(new Date(selectedRange.endDate)),
              ];

    const onRefresh = (abortSignal?: AbortSignal) =>
        dispatch(
            updateGraphData({
                accounts: [account],
                abortSignal,
            }),
        ).unwrap();
    const onSelectedRange = () =>
        dispatch(
            updateGraphData({
                accounts: [account],
            }),
        );
    const useNewBalanceGraph =
        isNewBalanceGraphEnabled &&
        getGraphFiatCoinId(account.symbol) !== undefined &&
        isNetworkWithGraphFeature(account.symbol, account.backendType);
    const legacyGraph = (
        <TransactionsGraph
            variant="one-asset"
            xTicks={xTicks}
            account={account}
            isLoading={isLoading}
            data={data}
            minMaxValues={[minMaxValues[0].toNumber(), minMaxValues[1].toNumber()]}
            localCurrency={baseCurrencyCode}
            onRefresh={onRefresh}
            selectedRange={selectedRange}
            receivedValueFn={entry => entry.received}
            sentValueFn={entry => entry.sent}
            balanceValueFn={entry => entry.balance}
        />
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
                                    iconLeft={RepeatIcon}
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
                                {useNewBalanceGraph ? (
                                    <AccountHistoricalFiatGraph
                                        account={account}
                                        fallback={legacyGraph}
                                        isGraphLoading={isLoading}
                                        showMarkers={showMarkers}
                                    />
                                ) : (
                                    legacyGraph
                                )}
                            </Row>
                            <Flex
                                gap={16}
                                direction={isBelowLaptop ? 'column' : 'row'}
                                justifyContent="space-between"
                                alignItems={isBelowLaptop ? 'flex-start' : 'center'}
                            >
                                <GraphRangeSelector
                                    onSelectedRange={onSelectedRange}
                                    isLoading={isLoading}
                                />
                                {useNewBalanceGraph && (
                                    <Switch
                                        isChecked={showMarkers}
                                        size="small"
                                        onChange={() => setShowMarkers(value => !value)}
                                        labelPosition={isBelowLaptop ? 'end' : 'start'}
                                        label={
                                            <Text
                                                typographyStyle="body-sm"
                                                priority="secondary"
                                                intent="neutral"
                                            >
                                                <Translation id="TR_GRAPH_SHOW_TRANSACTIONS" />
                                            </Text>
                                        }
                                    />
                                )}
                            </Flex>
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
                isGraphDataLoaded={isGraphDataLoaded}
            />
        </Column>
    );
};
