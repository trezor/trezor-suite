import React, { useState, useEffect, useCallback } from 'react';
import { GraphRange, AggregatedDashboardHistory } from '@wallet-types/fiatRates';
import { TransactionsGraph, Translation, HiddenPlaceholder } from '@suite-components';
import { Props } from './Container';
import { getUnixTime } from 'date-fns';
import styled from 'styled-components';
import { calcTicks, calcTicksFromData } from '@suite-utils/date';
import { colors, variables, Button } from '@trezor/components';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';
// https://github.com/zeit/next.js/issues/4768
// eslint-disable-next-line import/no-webpack-loader-syntax
import GraphWorker from 'worker-loader?name=static/[hash].worker.js!../../../../../../workers/graph.worker';
import { getMaxValueFromData } from '@suite/utils/wallet/graphUtils';

const Wrapper = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
`;

const GraphWrapper = styled(HiddenPlaceholder)`
    display: flex;
    flex: 1 1 auto;
    padding: ${CARD_PADDING_SIZE} 0px;
    height: 270px;
`;

const ErrorMessage = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 20px;
    align-items: center;
    justify-content: center;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
`;

const SmallErrorMessage = styled.div`
    display: flex;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const DashboardGraph = React.memo((props: Props) => {
    const {
        accounts,
        selectedDevice,
        updateGraphData,
        setSelectedRange,
        getGraphDataForInterval,
        localCurrency,
    } = props;
    const { selectedRange } = props.graph;

    const [data, setData] = useState<AggregatedDashboardHistory[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [xTicks, setXticks] = useState<number[]>([]);

    const selectedDeviceState = selectedDevice?.state;
    const { isLoading } = props.graph;
    const failedAccounts = props.graph.error?.filter(a => a.deviceState === selectedDeviceState);
    const allFailed = failedAccounts && failedAccounts.length === accounts.length;

    const onRefresh = useCallback(() => {
        updateGraphData(accounts);
    }, [updateGraphData, accounts]);

    const onSelectedRange = useCallback(
        (range: GraphRange) => {
            setSelectedRange(range);
            updateGraphData(accounts, { newAccountsOnly: true });
        },
        [setSelectedRange, updateGraphData, accounts],
    );

    const receivedValueFn = useCallback(
        (sourceData: AggregatedDashboardHistory) => sourceData.receivedFiat[localCurrency],
        [localCurrency],
    );

    const sentValueFn = useCallback(
        (sourceData: AggregatedDashboardHistory) => sourceData.sentFiat[localCurrency],
        [localCurrency],
    );

    const maxValue = getMaxValueFromData(data, 'dashboard', sentValueFn, receivedValueFn);

    useEffect(() => {
        if (!isLoading) {
            const worker = new GraphWorker();
            setIsProcessing(true);
            const rawData = getGraphDataForInterval({ deviceState: selectedDeviceState });

            worker.postMessage({
                history: rawData,
                groupBy: selectedRange.groupBy,
                type: 'dashboard',
            });

            const handleMessage = (event: MessageEvent) => {
                const aggregatedData = event.data;
                const graphTicks =
                    selectedRange.label === 'all'
                        ? calcTicksFromData(aggregatedData).map(getUnixTime)
                        : calcTicks(selectedRange.weeks).map(getUnixTime);

                setData(aggregatedData);
                setXticks(graphTicks);
                setIsProcessing(false);
            };

            worker.addEventListener('message', handleMessage);
            return () => {
                worker.removeEventListener('message', handleMessage);
            };
        }
    }, [isLoading, getGraphDataForInterval, selectedDeviceState, selectedRange]);

    return (
        <Wrapper data-test="@dashboard/graph">
            <GraphWrapper>
                {allFailed ? (
                    <ErrorMessage>
                        <Translation id="TR_COULD_NOT_RETRIEVE_DATA" />
                        <Button onClick={onRefresh} icon="REFRESH" variant="tertiary">
                            <Translation id="TR_RETRY" />
                        </Button>
                    </ErrorMessage>
                ) : (
                    <TransactionsGraph
                        variant="all-assets"
                        onRefresh={onRefresh}
                        isLoading={isLoading || isProcessing}
                        localCurrency={props.localCurrency}
                        xTicks={xTicks}
                        maxValue={maxValue}
                        data={data}
                        selectedRange={selectedRange}
                        onSelectedRange={onSelectedRange}
                        receivedValueFn={receivedValueFn}
                        sentValueFn={sentValueFn}
                    />
                )}
            </GraphWrapper>
            {failedAccounts && failedAccounts.length > 0 && (
                <SmallErrorMessage>
                    <Translation
                        id="TR_COULD_NOT_RETRIEVE_DATA_FOR"
                        values={{ accountsCount: failedAccounts.length }}
                    />
                </SmallErrorMessage>
            )}
        </Wrapper>
    );
});

// DashboardGraph.whyDidYouRender = true;
export default DashboardGraph;
