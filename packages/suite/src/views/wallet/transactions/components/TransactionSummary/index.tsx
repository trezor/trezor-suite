import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { colors, variables } from '@trezor/components';
import { Card } from '@suite-components';
import { AppState } from '@suite/types/suite';
import {
    getAccountFiatBalance,
    getTitleForNetwork,
    isTestnet,
    formatNetworkAmount,
} from '@wallet-utils/accountUtils';
import { Account } from '@wallet-types';
import { Translation } from '@suite-components/Translation';
import { connect } from 'react-redux';
import messages from '@suite/support/messages';
import InfoCard from './components/InfoCard';
import AccountTransactionsGraph from './components/AccountTransactionsGraph';
import { Await } from '@suite/types/utils';
import { fetchAccountHistory } from '@suite/actions/wallet/fiatRatesActions';
import BigNumber from 'bignumber.js';

const Wrapper = styled(Card)`
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
    flex-direction: column;
    flex: 1 1 auto;
    border-left: 1px solid ${colors.BLACK92};
`;

interface OwnProps {
    account: Account;
}

interface Range {
    label: string;
    weeks: number;
}

type AccountHistory = NonNullable<Await<ReturnType<typeof fetchAccountHistory>>>;

const TransactionSummary = (props: Props) => {
    const [data, setData] = useState<AccountHistory | null>(null);
    const { account } = props;

    const [selectedRange, setSelectedRange] = useState<Range>({
        label: 'year',
        weeks: 1,
    });
    const [isLoading, setIsLoading] = useState(false);

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
                console.log('processed', processed);
                setData(processed);
            }
            setIsLoading(false);
        };

        if (selectedRange && account) {
            setData(null);
            setIsLoading(false);
            fetchData();
        }
    }, [account, selectedRange, setData]);

    const numOfTransactions = data?.reduce((acc, d) => (acc += d.txs), 0);
    const totalSentAmount = data?.reduce((acc, d) => acc.plus(d.sent), new BigNumber(0));
    const totalReceivedAmount = data?.reduce((acc, d) => acc.plus(d.received), new BigNumber(0));

    return (
        <Wrapper>
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
                {/* TODO: what should be shown on error? */}
                <InfoCard
                    title="Incoming"
                    value={totalReceivedAmount?.toFixed()}
                    symbol={props.account.symbol}
                    stripe="green"
                    isLoading={isLoading}
                    isNumeric
                />
                <InfoCard
                    title="Outgoing"
                    value={totalSentAmount?.toFixed()}
                    symbol={props.account.symbol}
                    isLoading={isLoading}
                    stripe="red"
                    isNumeric
                />
                <InfoCard
                    title="Number of transactions"
                    isLoading={isLoading}
                    value={`${numOfTransactions} transactions`}
                />
            </InfoCardsWrapper>
        </Wrapper>
    );
};

const mapStateToProps = (state: AppState) => ({
    settings: state.wallet.settings,
    fiat: state.wallet.fiat,
});

const mapDispatchToProps = () => ({});

export type Props = ReturnType<typeof mapStateToProps> &
    ReturnType<typeof mapDispatchToProps> &
    OwnProps;

export default connect(mapStateToProps, mapDispatchToProps)(TransactionSummary);
