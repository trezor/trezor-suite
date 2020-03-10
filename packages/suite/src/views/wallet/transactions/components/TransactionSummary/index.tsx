import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors, variables, Button } from '@trezor/components';
import { Card } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import InfoCard from './components/InfoCard';
import AccountTransactionsGraph from './components/AccountTransactionsGraph';
import { Await } from '@suite/types/utils';
import { fetchAccountHistory } from '@suite/actions/wallet/fiatRatesActions';
import BigNumber from 'bignumber.js';

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const ContentWrapper = styled(Card)`
    width: 100%;
    margin-bottom: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.LG}) {
        flex-direction: column;
    }
`;

const GraphWrapper = styled.div`
    display: flex;
    flex: 1 1 70%;
    padding: 20px;
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

interface Props {
    account: Account;
}

interface Range {
    label: string;
    weeks: number;
}

type AccountHistory = NonNullable<Await<ReturnType<typeof fetchAccountHistory>>>;

const TransactionSummary = (props: Props) => {
    const [data, setData] = useState<AccountHistory | null>(null);
    const [isGraphHidden, setIsGraphHidden] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);

    const { account } = props;

    const [selectedRange, setSelectedRange] = useState<Range>({
        label: 'year',
        weeks: 52,
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const res = await fetchAccountHistory(account, selectedRange!.weeks);
            if (res) {
                const processed = res.map(i => ({
                    ...i,
                    received: formatNetworkAmount(i.received, account.symbol),
                    sent: formatNetworkAmount(`-${i.sent}`, account.symbol),
                }));
                setData(processed);
            } else {
                setError(true);
            }
            setIsLoading(false);
        };

        if (selectedRange && account) {
            setData(null);
            setIsLoading(false);
            setError(false);
            fetchData();
        }
    }, [account, selectedRange, setData]);

    const numOfTransactions = data?.reduce((acc, d) => (acc += d.txs), 0);
    const totalSentAmount = data?.reduce((acc, d) => acc.plus(d.sent), new BigNumber(0));
    const totalReceivedAmount = data?.reduce((acc, d) => acc.plus(d.received), new BigNumber(0));

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
                    <GraphWrapper>
                        <AccountTransactionsGraph
                            account={props.account}
                            isLoading={isLoading}
                            data={data}
                            selectedRange={selectedRange}
                            onSelectedRange={setSelectedRange}
                        />
                    </GraphWrapper>
                    <InfoCardsWrapper>
                        {!error && (
                            <>
                                <InfoCard
                                    title={<Translation {...messages.TR_INCOMING} />}
                                    value={totalReceivedAmount?.toFixed()}
                                    symbol={props.account.symbol}
                                    stripe="green"
                                    isLoading={isLoading}
                                    isNumeric
                                />
                                <InfoCard
                                    title={<Translation {...messages.TR_OUTGOING} />}
                                    value={totalSentAmount?.toFixed()}
                                    symbol={props.account.symbol}
                                    isLoading={isLoading}
                                    stripe="red"
                                    isNumeric
                                />
                                <InfoCard
                                    title={<Translation {...messages.TR_NUMBER_OF_TRANSACTIONS} />}
                                    isLoading={isLoading}
                                    value={
                                        <Translation
                                            {...messages.TR_N_TRANSACTIONS}
                                            values={{ value: numOfTransactions }}
                                        />
                                    }
                                />
                            </>
                        )}
                    </InfoCardsWrapper>
                </ContentWrapper>
            )}
        </Wrapper>
    );
};

export default TransactionSummary;
