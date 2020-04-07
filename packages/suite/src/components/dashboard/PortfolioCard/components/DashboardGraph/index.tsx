import React, { useState, useEffect } from 'react';
import { GraphRange } from '@wallet-types/fiatRates';
import { TransactionsGraph } from '@suite-components';
import { Props } from './Container';
import { Await } from '@suite/types/utils';
import { fetchAggregatedHistory } from '@suite/actions/wallet/fiatRatesActions';
import { subWeeks, getUnixTime } from 'date-fns';
import styled from 'styled-components';
import { calcTicks } from '@suite/utils/suite/date';
import { colors, variables } from '@trezor/components';

const GraphWrapper = styled.div`
    display: flex;
    flex: 1 1 auto;
    padding: 20px;
    height: 270px;
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

type AccountHistory = NonNullable<Await<ReturnType<typeof fetchAggregatedHistory>>>;

const DashboardGraph = (props: Props) => {
    const { discoveryInProgress, accounts } = props;
    const [data, setData] = useState<AccountHistory | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(false);
    const [selectedRange, setSelectedRange] = useState<GraphRange>({
        label: 'year',
        weeks: 52,
    });

    useEffect(() => {
        let isSubscribed = true; // to make sure we are not updating state after component unmount
        const fetchData = async () => {
            if (isSubscribed) setIsLoading(true);
            const startDate = subWeeks(new Date(), selectedRange.weeks);
            const endDate = new Date();
            const secondsInDay = 3600 * 24;
            const secondsInMonth = secondsInDay * 30;
            const groupBy = selectedRange.weeks >= 52 ? secondsInMonth : secondsInDay;
            const res = await fetchAggregatedHistory(accounts, startDate, endDate, groupBy, true);

            if (res && isSubscribed) {
                setData(res);
            } else {
                setError(true);
            }
            setIsLoading(false);
        };

        if (!discoveryInProgress && selectedRange && accounts.length > 0) {
            setData(null);
            setIsLoading(false);
            setError(false);
            fetchData();
        }
        return () => {
            isSubscribed = false;
        };
    }, [accounts, selectedRange, setData, discoveryInProgress]);

    const xTicks = calcTicks(selectedRange.weeks).map(getUnixTime);

    return (
        <GraphWrapper>
            {error && <ErrorMessage>Could not load data</ErrorMessage>}
            {!error && (
                <TransactionsGraph
                    variant="all-assets"
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
    );
};

export default DashboardGraph;
