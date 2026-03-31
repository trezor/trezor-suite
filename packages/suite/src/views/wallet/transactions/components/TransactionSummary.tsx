import { useEffect, useState } from 'react';

import { getUnixTime } from 'date-fns';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectHasExperimentalFeature } from '@suite/settings';
import { calcTicks, calcTicksFromData } from '@suite-common/suite-utils';
import { getCoingeckoId, getNetworkFeatures } from '@suite-common/wallet-config';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Button, Card, Column, Icon, Paragraph, Row, Switch, Text } from '@trezor/components';
import { typography } from '@trezor/theme';
import { BigNumber } from '@trezor/utils';

import { updateGraphData } from 'src/actions/wallet/graphActions';
import { GraphRangeSelector, HiddenPlaceholder, TransactionsGraph } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { type AppState } from 'src/types/suite';
import { type Account } from 'src/types/wallet';
import { type GraphRange } from 'src/types/wallet/graph';
import {
    aggregateBalanceHistory,
    getGraphDataForInterval,
    getMinMaxValueFromData,
    isNetworkWithGraphFeature,
    isNetworkWithLegacyGraphFeature,
} from 'src/utils/wallet/graph';
import {
    LiveFiatGraph,
    hasCoinbaseLiveSupport,
} from 'src/views/dashboard/PortfolioCard/LiveFiatGraph';
import { UnsupportedAssetsMessage } from 'src/views/dashboard/PortfolioCard/UnsupportedAssetsMessage';

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

const selectSelectedRange = (state: AppState) => state.wallet.graph.selectedRange;
const selectGraph = (state: AppState) => state.wallet.graph;

export const TransactionSummary = ({ account }: TransactionSummaryProps) => {
    const selectedRange = useSelector(selectSelectedRange);
    const graph = useSelector(selectGraph);
    const isNewBalanceGraphEnabled = useSelector(selectHasExperimentalFeature('new-balance-graph'));

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();

    const [isLive, setIsLive] = useState(false);
    const [showMarkers, setShowMarkers] = useState(true);

    const intervalGraphData = getGraphDataForInterval({ account, graph });
    const data = intervalGraphData[0]?.data
        ? aggregateBalanceHistory(intervalGraphData, selectedRange.groupBy, 'account')
        : [];

    const error = intervalGraphData[0]?.error ?? false;
    const isGraphLoading = intervalGraphData[0]?.isLoading ?? false;
    const isLoading = isGraphLoading && data.length === 0;
    const minMaxValues = getMinMaxValueFromData(
        data,
        'account',
        d => new BigNumber(d.sent),
        d => new BigNumber(d.received),
        d => new BigNumber(d.balance),
    );

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
    const isGraphSupported = isNewBalanceGraphEnabled
        ? isNetworkWithGraphFeature(account.symbol, account.backendType)
        : isNetworkWithLegacyGraphFeature(account.symbol, account.backendType);
    const hasCoingeckoPrice = !!getCoingeckoId(account.symbol);
    const showGraph = hasCoingeckoPrice && isGraphSupported;
    const hasLiveSupport = hasCoinbaseLiveSupport(account.symbol);
    const hasTokens = getNetworkFeatures(account.symbol).includes('tokens');
    const xTicks =
        selectedRange.label === 'all'
            ? calcTicksFromData(data).map(getUnixTime)
            : calcTicks(selectedRange.startDate, selectedRange.endDate).map(getUnixTime);

    useEffect(() => {
        if ((!hasLiveSupport || !isNewBalanceGraphEnabled) && isLive) {
            setIsLive(false);
        }
    }, [hasLiveSupport, isLive, isNewBalanceGraphEnabled]);

    const onSelectedRange = isGraphSupported
        ? (range: GraphRange) =>
              dispatch(
                  updateGraphData({
                      accounts: [account],
                      selectedRange: range,
                  }),
              )
        : undefined;

    const graphCardControls = (
        <Column alignItems="stretch" gap={12}>
            {hasTokens && (
                <Row gap={8} alignItems="center">
                    <Icon name="info" size={16} intent="neutral" priority="secondary" />
                    <Paragraph typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <UnsupportedAssetsMessage affectedNetworks={[]} hasTokens />
                    </Paragraph>
                </Row>
            )}
            <Row justifyContent="space-between" alignItems="center" gap={24}>
                <GraphRangeSelector
                    onSelectedRange={onSelectedRange}
                    isLive={isLive}
                    isLoading={isGraphLoading}
                    onLiveChange={setIsLive}
                    showLiveOption={isNewBalanceGraphEnabled && hasLiveSupport}
                />
                {isNewBalanceGraphEnabled ? (
                    <Switch
                        isChecked={showMarkers}
                        onChange={setShowMarkers}
                        label={
                            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                                <Translation id="TR_GRAPH_SHOW_TRANSACTIONS" />
                            </Text>
                        }
                        size="small"
                        labelPosition="start"
                    />
                ) : (
                    <div />
                )}
            </Row>
        </Column>
    );

    return (
        <Column alignItems="stretch" gap={20}>
            {showGraph && (
                <>
                    <Column alignItems="stretch">
                        {error ? (
                            <Card paddingType="none">
                                <Column alignItems="stretch" padding={24} gap={24}>
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
                                    {graphCardControls}
                                </Column>
                            </Card>
                        ) : (
                            <HiddenPlaceholder enforceIntensity={8}>
                                <Card overflow="visible" paddingType="none">
                                    <Column alignItems="stretch" padding={24} gap={40}>
                                        <Row height={320} overflow="visible" alignItems="stretch">
                                            {isNewBalanceGraphEnabled ? (
                                                <LiveFiatGraph
                                                    account={account}
                                                    isLive={isLive}
                                                    isGraphLoading={isGraphLoading}
                                                    showMarkers={showMarkers}
                                                />
                                            ) : (
                                                <TransactionsGraph
                                                    hideToolbar
                                                    variant="one-asset"
                                                    xTicks={xTicks}
                                                    account={account}
                                                    isLoading={isGraphLoading}
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
                                            )}
                                        </Row>
                                        {graphCardControls}
                                    </Column>
                                </Card>
                            </HiddenPlaceholder>
                        )}
                    </Column>
                </>
            )}
            {showGraph && (
                <SummaryCards
                    selectedRange={selectedRange}
                    dataInterval={dataInterval}
                    data={data}
                    localCurrency={baseCurrencyCode}
                    account={account}
                    isGraphSupported={isGraphSupported}
                    isLoading={isLoading}
                />
            )}
        </Column>
    );
};
