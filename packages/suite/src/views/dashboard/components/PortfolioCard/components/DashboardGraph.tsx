import { memo, useState, useEffect, useCallback } from 'react';

import { getUnixTime } from 'date-fns';
import styled from 'styled-components';

import { variables, Button } from '@trezor/components';
import { calcTicks, calcTicksFromData } from '@suite-common/suite-utils';
import { selectDevice } from '@suite-common/wallet-core';

import GraphWorker from 'src/support/workers/graph';
import { getGraphDataForInterval, updateGraphData } from 'src/actions/wallet/graphActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import { TransactionsGraph, Translation, HiddenPlaceholder } from 'src/components/suite';
import { AggregatedDashboardHistory } from 'src/types/wallet/graph';
import { getMinMaxValueFromData } from 'src/utils/wallet/graph';

const Wrapper = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
`;

const GraphWrapper = styled(HiddenPlaceholder)`
    display: flex;
    flex: 1 1 auto;
    padding: 16px 0;
    height: 320px;
`;

const ErrorMessage = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    padding: 20px;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
`;

interface DashboardGraphProps {
    accounts: Account[];
}

// DashboardGraph.whyDidYouRender = true;
export const DashboardGraph = memo(({ accounts }: DashboardGraphProps) => {
    const { error, isLoading, selectedRange } = useSelector(state => state.wallet.graph);
    const selectedDevice = useSelector(selectDevice);
    const localCurrency = useSelector(state => state.wallet.settings.localCurrency);
    const dispatch = useDispatch();

    const [data, setData] = useState<AggregatedDashboardHistory[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [xTicks, setXticks] = useState<number[]>([]);

    const selectedDeviceState = selectedDevice?.state;
    const failedAccounts = error?.filter(a => a.deviceState === selectedDeviceState);
    const allFailed =
        failedAccounts &&
        failedAccounts.every(fa => accounts.some(a => a.descriptor === fa.descriptor));

    const onRefresh = useCallback(() => {
        dispatch(updateGraphData(accounts));
    }, [accounts, dispatch]);

    const receivedValueFn = useCallback(
        (sourceData: AggregatedDashboardHistory) => sourceData.receivedFiat[localCurrency],
        [localCurrency],
    );

    const sentValueFn = useCallback(
        (sourceData: AggregatedDashboardHistory) => sourceData.sentFiat[localCurrency],
        [localCurrency],
    );

    const balanceValueFn = useCallback(
        (sourceData: AggregatedDashboardHistory) => sourceData.balanceFiat?.[localCurrency],
        [localCurrency],
    );

    const minMaxValues = getMinMaxValueFromData(
        data,
        'dashboard',
        sentValueFn,
        receivedValueFn,
        () => '0',
    );

    useEffect(() => {
        if (!isLoading) {
            const worker = new GraphWorker();
            setIsProcessing(true);
            const rawData = dispatch(getGraphDataForInterval({ deviceState: selectedDeviceState }));

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
                        : calcTicks(selectedRange.startDate, selectedRange.endDate).map(
                              getUnixTime,
                          );

                setData(aggregatedData);
                setXticks(graphTicks);
                setIsProcessing(false);
            };

            worker.addEventListener('message', handleMessage);

            return () => {
                worker.removeEventListener('message', handleMessage);
                worker.terminate();
            };
        }
    }, [dispatch, isLoading, selectedDeviceState, selectedRange]);

    return (
        <Wrapper data-test-id="@dashboard/graph">
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
                        hideToolbar
                        variant="all-assets"
                        onRefresh={onRefresh}
                        isLoading={isLoading || isProcessing}
                        localCurrency={localCurrency}
                        xTicks={xTicks}
                        minMaxValues={minMaxValues}
                        data={data}
                        selectedRange={selectedRange}
                        receivedValueFn={receivedValueFn}
                        sentValueFn={sentValueFn}
                        balanceValueFn={balanceValueFn}
                    />
                )}
            </GraphWrapper>
        </Wrapper>
    );
});
