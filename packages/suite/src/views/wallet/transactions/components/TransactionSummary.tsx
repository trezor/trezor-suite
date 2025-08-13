import { getUnixTime } from 'date-fns';
import styled from 'styled-components';

import { calcTicks, calcTicksFromData } from '@suite-common/suite-utils';
import { hasNetworkPotentialFraudTransactions } from '@suite-common/token-definitions';
import { selectBaseCurrency } from '@suite-common/wallet-core';
import { Button, Card, Column, Row, variables } from '@trezor/components';
import { BigNumber } from '@trezor/utils';

import { updateGraphData } from 'src/actions/wallet/graphActions';
import {
    GraphRangeSelector,
    HiddenPlaceholder,
    TransactionsGraph,
    Translation,
} from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { Account } from 'src/types/wallet';
import {
    aggregateBalanceHistory,
    getGraphDataForInterval,
    getMinMaxValueFromData,
} from 'src/utils/wallet/graph';

import { SummaryCards } from './SummaryCards';
import { TransactionSummaryDropdown } from './TransactionSummaryDropdown';

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

    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const dispatch = useDispatch();

    const intervalGraphData = getGraphDataForInterval({ account, graph });
    const data = intervalGraphData[0]?.data
        ? aggregateBalanceHistory(intervalGraphData, selectedRange.groupBy, 'account')
        : [];

    if (account.networkType === 'ripple' || account.networkType === 'stellar') {
        return null;
    }

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
                newAccountsOnly: true,
            }),
        );

    return (
        <Column alignItems="stretch" gap={20}>
            {account.networkType !== 'solana' && (
                <>
                    <Row justifyContent="space-between" alignItems="center">
                        <GraphRangeSelector
                            onSelectedRange={onSelectedRange}
                            placement={{ position: 'bottom', alignment: 'end' }}
                        />
                        <TransactionSummaryDropdown />
                    </Row>

                    <Column alignItems="stretch">
                        {error ? (
                            <Card>
                                <Row height={320} overflow="visible" alignItems="stretch">
                                    <ErrorMessage>
                                        <Translation id="TR_COULD_NOT_RETRIEVE_DATA" />
                                        <Button
                                            onClick={() => onRefresh()}
                                            icon="repeat"
                                            variant="tertiary"
                                        >
                                            <Translation id="TR_RETRY" />
                                        </Button>
                                    </ErrorMessage>
                                </Row>
                            </Card>
                        ) : (
                            <HiddenPlaceholder enforceIntensity={8}>
                                <Card overflow="visible">
                                    <Row height={320} overflow="visible" alignItems="stretch">
                                        <TransactionsGraph
                                            hideToolbar
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
            {!hasNetworkPotentialFraudTransactions(account.symbol) && (
                <SummaryCards
                    selectedRange={selectedRange}
                    dataInterval={dataInterval}
                    data={data}
                    localCurrency={baseCurrencyCode}
                    account={account}
                    isLoading={isLoading}
                />
            )}
        </Column>
    );
};
