import React, { useState } from 'react';
import styled from 'styled-components';
import { colors, variables, Button } from '@trezor/components';
import { Card, TransactionsGraph, Translation, HiddenPlaceholder } from '@suite-components';
import messages from '@suite/support/messages';
import InfoCard from './components/InfoCard';
import BigNumber from 'bignumber.js';
import { getUnixTime } from 'date-fns';
import { calcTicks, calcTicksFromData } from '@suite-utils/date';
import { accountGraphDataFilterFn, aggregateBalanceHistory } from '@wallet-utils/graphUtils';
import { GraphRange, AggregatedAccountHistory } from '@wallet-types/fiatRates';
import { Props } from './Container';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const ContentWrapper = styled(Card)`
    width: 100%;
    margin-bottom: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        flex-direction: column;
    }
`;

const GraphWrapper = styled(HiddenPlaceholder)`
    display: flex;
    flex: 5 1 auto;
    padding: ${CARD_PADDING_SIZE};
    height: 240px;
`;

const InfoCardsWrapper = styled.div`
    display: flex;
    height: 240px;
    flex-direction: column;
    flex: 0 1 auto;
    border-left: 1px solid ${colors.BLACK92};

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        border-left: none;
    }
`;

const Actions = styled.div`
    display: flex;
    padding: 0px 16px;
    margin-bottom: 8px;
    opacity: 0.8;
    justify-content: space-between;
`;

const ErrorMessage = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 240px;
    padding: 20px;
    align-items: center;
    justify-content: center;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.SMALL};
    text-align: center;
`;

const TransactionSummary = (props: Props) => {
    const { selectedRange } = props.graph;
    const graphData = props.graph.data.filter(d => accountGraphDataFilterFn(d, props.account));

    const [isGraphHidden, setIsGraphHidden] = useState(false);

    const intervalGraphData = graphData.find(d => d.interval === selectedRange.label);

    const data = intervalGraphData?.data
        ? (aggregateBalanceHistory(
              [intervalGraphData],
              selectedRange.groupBy,
              'account',
          ) as AggregatedAccountHistory[])
        : null;

    const error = intervalGraphData?.error ?? false;
    const isLoading = intervalGraphData?.isLoading ?? false;

    const numOfTransactions = data?.reduce((acc, d) => (acc += d.txs), 0);
    const totalSentAmount = data?.reduce((acc, d) => acc.plus(d.sent), new BigNumber(0));
    const totalReceivedAmount = data?.reduce((acc, d) => acc.plus(d.received), new BigNumber(0));

    const xTicks =
        selectedRange.label === 'all'
            ? calcTicksFromData(data || []).map(getUnixTime)
            : calcTicks(selectedRange.weeks).map(getUnixTime);

    return (
        <Wrapper>
            <Actions>
                <Button
                    variant="tertiary"
                    size="small"
                    icon={isGraphHidden ? 'ARROW_DOWN' : 'ARROW_UP'}
                    onClick={() => {
                        setIsGraphHidden(!isGraphHidden);
                    }}
                >
                    {isGraphHidden ? 'Show graph' : 'Hide graph'}
                </Button>
                {/* TODO: export transactions to a file */}
            </Actions>
            {!isGraphHidden && (
                <ContentWrapper noPadding>
                    {error && (
                        <ErrorMessage>
                            <Translation id="TR_COULD_NOT_RETRIEVE_DATA" />
                            <Button
                                onClick={() => props.updateGraphData([props.account])}
                                icon="REFRESH"
                                variant="tertiary"
                                size="small"
                            >
                                <Translation id="TR_RETRY" />
                            </Button>
                        </ErrorMessage>
                    )}
                    {!error && (
                        <>
                            <GraphWrapper intensity={5}>
                                <TransactionsGraph
                                    variant="one-asset"
                                    xTicks={xTicks}
                                    account={props.account}
                                    isLoading={isLoading}
                                    data={data}
                                    localCurrency={props.localCurrency}
                                    onRefresh={() => props.updateGraphData([props.account])}
                                    selectedRange={selectedRange}
                                    onSelectedRange={(range: GraphRange) => {
                                        props.setSelectedRange(range);
                                        props.updateGraphData([props.account]);
                                    }}
                                    receivedValueFn={data => data.received}
                                    sentValueFn={data => data.sent}
                                />
                            </GraphWrapper>
                            <InfoCardsWrapper>
                                <>
                                    <InfoCard
                                        title={<Translation {...messages.TR_INCOMING} />}
                                        value={totalReceivedAmount?.toFixed()}
                                        symbol={props.account.symbol}
                                        isLoading={isLoading}
                                        isNumeric
                                    />
                                    <InfoCard
                                        title={<Translation {...messages.TR_OUTGOING} />}
                                        value={totalSentAmount?.negated().toFixed()}
                                        symbol={props.account.symbol}
                                        isLoading={isLoading}
                                        isNumeric
                                    />
                                    <InfoCard
                                        title={
                                            <Translation {...messages.TR_NUMBER_OF_TRANSACTIONS} />
                                        }
                                        isLoading={isLoading}
                                        value={
                                            <HiddenPlaceholder>
                                                <Translation
                                                    {...messages.TR_N_TRANSACTIONS}
                                                    values={{ value: numOfTransactions }}
                                                />
                                            </HiddenPlaceholder>
                                        }
                                    />
                                </>
                            </InfoCardsWrapper>
                        </>
                    )}
                </ContentWrapper>
            )}
        </Wrapper>
    );
};

export default TransactionSummary;
