import React, { useState, useEffect, useRef } from 'react';
import { GraphRange } from '@wallet-types/fiatRates';
import { TransactionsGraph } from '@suite-components';
import { Props } from './Container';
import { getUnixTime } from 'date-fns';
import styled from 'styled-components';
import { calcTicks } from '@suite/utils/suite/date';
import { colors, variables, Button } from '@trezor/components';
import { aggregateBalanceHistory, deviceGraphDataFilterFn } from '@wallet-utils/graphUtils';
import { SETTINGS } from '@suite-config';

const Wrapper = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
`;

const GraphWrapper = styled.div`
    display: flex;
    flex: 1 1 auto;
    padding: 20px;
    height: 270px;
`;

const ErrorMessage = styled.div`
    display: flex;
    width: 100%;
    padding: 20px;
    align-items: center;
    justify-content: center;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

const SmallErrorMessage = styled.div`
    display: flex;
    padding: 16px;
    padding-top: 0px;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
`;

const DashboardGraph = (props: Props) => {
    const { accounts, updateGraphData, selectedDevice } = props;
    const [selectedRange, setSelectedRange] = useState<GraphRange>(SETTINGS.DEFAULT_GRAPH_RANGE);
    const didMountRef = useRef(false);

    const isLoading = props.graph.isLoading[selectedRange.label];
    const failedAccounts = props.graph.error[selectedRange.label];

    const xTicks = calcTicks(selectedRange.weeks).map(getUnixTime);
    const deviceGraphData = selectedDevice
        ? props.graph.data.filter(
              d =>
                  deviceGraphDataFilterFn(d, selectedDevice.state) &&
                  d.interval === selectedRange.label,
          )
        : [];

    const data = aggregateBalanceHistory(deviceGraphData);
    const dataLength = data.length;

    useEffect(() => {
        if (didMountRef.current) {
            // console.log('running use effect', accounts, selectedRange);
            if (dataLength === 0) {
                updateGraphData(accounts, selectedRange);
            }
        } else {
            didMountRef.current = true;
        }
    }, [accounts, dataLength, selectedRange, updateGraphData]);

    return (
        <Wrapper>
            <GraphWrapper>
                {failedAccounts && failedAccounts.length === accounts.length ? (
                    <ErrorMessage>
                        Could not load data{' '}
                        <Button
                            onClick={() => {
                                props.updateGraphData(accounts, selectedRange);
                            }}
                            icon="REFRESH"
                            variant="tertiary"
                            size="small"
                        >
                            Retry
                        </Button>
                    </ErrorMessage>
                ) : (
                    <TransactionsGraph
                        variant="all-assets"
                        onRefresh={() => {
                            props.updateGraphData(accounts, selectedRange);
                        }}
                        isLoading={isLoading}
                        localCurrency={props.localCurrency}
                        xTicks={xTicks}
                        data={data}
                        selectedRange={selectedRange}
                        onSelectedRange={setSelectedRange}
                        receivedValueFn={data => data.receivedFiat[props.localCurrency]}
                        sentValueFn={data => data.sentFiat[props.localCurrency]}
                    />
                )}
            </GraphWrapper>
            {failedAccounts && failedAccounts.length > 0 && (
                <SmallErrorMessage>
                    *Could not retrieve data for {failedAccounts.length} accounts.
                </SmallErrorMessage>
            )}
        </Wrapper>
    );
};

export default DashboardGraph;
