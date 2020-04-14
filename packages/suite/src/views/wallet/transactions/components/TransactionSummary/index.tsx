import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { colors, variables, Button } from '@trezor/components';
import { Card, TransactionsGraph, Translation } from '@suite-components';
import { Account } from '@wallet-types';
import messages from '@suite/support/messages';
import InfoCard from './components/InfoCard';
import BigNumber from 'bignumber.js';
import { getUnixTime } from 'date-fns';
import { calcTicks } from '@suite/utils/suite/date';
import { GraphRange } from '@suite/types/wallet/fiatRates';
import { GraphData } from '@suite/reducers/wallet/graphReducer';

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

const GraphWrapper = styled.div`
    display: flex;
    flex: 5 1 auto;
    padding: 20px;
    height: 240px;
    max-width: 600px; /* workaround to prevent recharts filling all space */

    @media screen and (max-width: ${variables.SCREEN_SIZE.XL}) {
        max-width: 100%;
    }
`;

const InfoCardsWrapper = styled.div`
    display: flex;
    min-height: 240px;
    flex-direction: column;
    flex: 1 1 auto;
    border-left: 1px solid ${colors.BLACK92};
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
    width: 100%;
    padding: 32px;
    align-items: center;
    justify-content: center;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

interface Props {
    account: Account;
    graphData: GraphData[];
    updateGraphData: (accounts: Account[], range: GraphRange) => void;
}

const TransactionSummary = (props: Props) => {
    const { updateGraphData, account } = props;
    const didMountRef = useRef(false);
    const [isGraphHidden, setIsGraphHidden] = useState(false);
    const [selectedRange, setSelectedRange] = useState<GraphRange>({
        label: 'year',
        weeks: 52,
    });

    const intervalGraphData = props.graphData.find(d => d.interval === selectedRange.label);
    const data = intervalGraphData?.data ?? null;
    const error = intervalGraphData?.error ?? false;
    const isLoading = intervalGraphData?.isLoading ?? false;

    const numOfTransactions = data?.reduce((acc, d) => (acc += d.txs), 0);
    const totalSentAmount = data?.reduce((acc, d) => acc.plus(d.sent), new BigNumber(0));
    const totalReceivedAmount = data?.reduce((acc, d) => acc.plus(d.received), new BigNumber(0));

    const xTicks = calcTicks(selectedRange.weeks, { skipDays: true }).map(getUnixTime);

    useEffect(() => {
        if (didMountRef.current) {
            if (!data) {
                updateGraphData([account], selectedRange);
            }
        } else {
            didMountRef.current = true;
        }
    }, [account, data, selectedRange, updateGraphData]);

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
                <ContentWrapper>
                    {/* TODO: what should be shown on error? */}
                    {error && <ErrorMessage>Could not load data</ErrorMessage>}
                    {!error && (
                        <>
                            <GraphWrapper>
                                <TransactionsGraph
                                    variant="one-asset"
                                    xTicks={xTicks}
                                    account={props.account}
                                    isLoading={isLoading}
                                    data={data}
                                    onRefresh={() =>
                                        props.updateGraphData([props.account], selectedRange)
                                    }
                                    selectedRange={selectedRange}
                                    onSelectedRange={setSelectedRange}
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
                                            <Translation
                                                {...messages.TR_N_TRANSACTIONS}
                                                values={{ value: numOfTransactions }}
                                            />
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
