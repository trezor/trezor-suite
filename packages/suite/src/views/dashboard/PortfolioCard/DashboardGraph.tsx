import { memo, useCallback, useEffect, useState } from 'react';

import { getUnixTime } from 'date-fns';
import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { selectSelectedDevice } from '@suite-common/device';
import { calcTicks, calcTicksFromData } from '@suite-common/suite-utils';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { BASE_CURRENCY_ZERO } from '@suite-common/wallet-utils';
import { Box, Button } from '@trezor/components';
import { typography } from '@trezor/theme';

import { updateGraphData } from 'src/actions/wallet/graphActions';
import { HiddenPlaceholder, TransactionsGraph } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import { type Account } from 'src/types/wallet';
import { type AggregatedDashboardHistory } from 'src/types/wallet/graph';
import { getMinMaxValueFromData, prepareGraphDataAsync } from 'src/utils/wallet/graph';

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
    color: ${({ theme }) => theme.contentSecondary};
    ${typography['body-sm']}
    text-align: center;
`;

type DashboardGraphProps = {
    accounts: Account[];
};

export const DashboardGraph = memo(({ accounts }: DashboardGraphProps) => {
    const graph = useSelector(state => state.wallet.graph);
    const selectedDevice = useSelector(selectSelectedDevice);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();
    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();

    const [data, setData] = useState<AggregatedDashboardHistory[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [xTicks, setXticks] = useState<number[]>([]);

    const selectedDeviceState = selectedDevice?.state?.staticSessionId;
    const failedAccounts = graph.error?.filter(a => a.deviceState === selectedDeviceState);
    const allFailed =
        failedAccounts !== undefined &&
        accounts.every(a => failedAccounts.some(fa => fa.descriptor === a.descriptor));

    const onRefresh = useCallback(
        () => dispatch(updateGraphData({ accounts })).unwrap(),
        [accounts, dispatch],
    );

    const receivedValueFn = useCallback(
        (sourceData: AggregatedDashboardHistory) => sourceData.receivedFiat[baseCurrencyCode],
        [baseCurrencyCode],
    );

    const sentValueFn = useCallback(
        (sourceData: AggregatedDashboardHistory) => sourceData.sentFiat[baseCurrencyCode],
        [baseCurrencyCode],
    );

    const balanceValueFn = useCallback(
        (sourceData: AggregatedDashboardHistory) => sourceData.balanceFiat?.[baseCurrencyCode],
        [baseCurrencyCode],
    );

    const minMaxValues = getMinMaxValueFromData(
        data,
        'dashboard',
        sentValueFn,
        receivedValueFn,
        () => BASE_CURRENCY_ZERO,
    );

    useEffect(() => {
        if (!graph.isLoading) {
            setIsProcessing(true);

            prepareGraphDataAsync({ graph, deviceState: selectedDeviceState }).then(
                aggregatedData => {
                    const graphTicks =
                        graph.selectedRange.label === 'all'
                            ? calcTicksFromData(aggregatedData).map(getUnixTime)
                            : calcTicks(
                                  graph.selectedRange.startDate,
                                  graph.selectedRange.endDate,
                              ).map(getUnixTime);

                    setData(aggregatedData);
                    setXticks(graphTicks);
                    setIsProcessing(false);
                },
            );
        }
    }, [graph, selectedDeviceState]);

    return (
        <Wrapper data-testid="@dashboard/graph">
            <GraphWrapper>
                {allFailed ? (
                    <ErrorMessage>
                        <Translation id="TR_COULD_NOT_RETRIEVE_DATA" />
                        <Button
                            onClick={onRefresh}
                            iconLeft="repeat"
                            intent="neutral"
                            priority="secondary"
                        >
                            <Translation id="TR_RETRY" />
                        </Button>
                    </ErrorMessage>
                ) : (
                    <Box
                        margin={
                            isContentBelowBreakpoint ? undefined : { vertical: 12, horizontal: 20 }
                        }
                        width="100%"
                        height="100%"
                    >
                        <TransactionsGraph
                            hideToolbar
                            variant="all-assets"
                            onRefresh={onRefresh}
                            isLoading={graph.isLoading || isProcessing}
                            localCurrency={baseCurrencyCode}
                            xTicks={xTicks}
                            minMaxValues={[minMaxValues[0].toNumber(), minMaxValues[1].toNumber()]}
                            data={data}
                            selectedRange={graph.selectedRange}
                            receivedValueFn={receivedValueFn}
                            sentValueFn={sentValueFn}
                            balanceValueFn={balanceValueFn}
                        />
                    </Box>
                )}
            </GraphWrapper>
        </Wrapper>
    );
});
