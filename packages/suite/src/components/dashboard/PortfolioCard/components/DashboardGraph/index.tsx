import React from 'react';
import { GraphRange } from '@wallet-types/fiatRates';
import { TransactionsGraph, Translation, HiddenPlaceholder } from '@suite-components';
import { Props } from './Container';
import { getUnixTime } from 'date-fns';
import styled from 'styled-components';
import { calcTicks, calcTicksFromData } from '@suite/utils/suite/date';
import { colors, variables, Button } from '@trezor/components';
import { aggregateBalanceHistory, deviceGraphDataFilterFn } from '@wallet-utils/graphUtils';

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
    const { accounts, selectedDevice } = props;
    const { selectedRange } = props.graph;
    const isLoading = props.graph.isLoading[selectedRange.label];
    const failedAccounts = props.graph.error[selectedRange.label];

    const deviceGraphData = selectedDevice
        ? props.graph.data.filter(
              d =>
                  deviceGraphDataFilterFn(d, selectedDevice.state) &&
                  d.interval === selectedRange.label,
          )
        : [];

    const data = aggregateBalanceHistory(deviceGraphData);
    const xTicks =
        selectedRange.label === 'all'
            ? calcTicksFromData(data).map(getUnixTime)
            : calcTicks(selectedRange.weeks).map(getUnixTime);

    return (
        <Wrapper data-test="@dashboard/graph">
            <GraphWrapper>
                {failedAccounts && failedAccounts.length === accounts.length ? (
                    <ErrorMessage>
                        <Translation id="TR_COULD_NOT_RETRIEVE_DATA" />{' '}
                        <Button
                            onClick={() => {
                                props.updateGraphData(accounts);
                            }}
                            icon="REFRESH"
                            variant="tertiary"
                            size="small"
                        >
                            <Translation id="TR_RETRY" />
                        </Button>
                    </ErrorMessage>
                ) : (
                    <TransactionsGraph
                        variant="all-assets"
                        onRefresh={() => {
                            props.updateGraphData(accounts);
                        }}
                        isLoading={isLoading}
                        localCurrency={props.localCurrency}
                        xTicks={xTicks}
                        data={data}
                        selectedRange={selectedRange}
                        onSelectedRange={(range: GraphRange) => {
                            props.setSelectedRange(range);
                            props.updateGraphData(accounts);
                        }}
                        receivedValueFn={data => data.receivedFiat[props.localCurrency]}
                        sentValueFn={data => data.sentFiat[props.localCurrency]}
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
};

export default DashboardGraph;
