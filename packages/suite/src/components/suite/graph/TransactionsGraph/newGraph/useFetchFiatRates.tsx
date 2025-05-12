import { useEffect, useState } from 'react';

import { getUnixTime, isAfter, isBefore } from 'date-fns';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { Account } from '@suite-common/wallet-types';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { demoData } from './data';
import { RawDataItem } from './types';
import { sanitizeCoinData } from './utils';
import { GraphRange } from '../../../../../types/wallet/graph';

// const VISIBLE_TIMESLOTS_IN_CHART = 100;

const fetchMockData = (selectedRange: GraphRange) => {
    const rawData = sanitizeCoinData(demoData, selectedRange);

    if (!selectedRange.startDate && !selectedRange.endDate) return rawData;

    return rawData.filter(
        item =>
            isBefore(new Date(item.date), selectedRange.endDate) &&
            isAfter(new Date(item.date), selectedRange.startDate),
    );
};

// const fetchDataFromCoingecko = async (selectedRange: GraphRange, localCurrency: string) => {
//     //getBalanceHistory
//     // zpub6rpZ3Q1MYUfqGRRDjsjMLxQ1NiTanLrbeJDRaqf7PdMnPW4dpnUaAcNLQRZyebJCoV6WUBfXQieDikrWMKqk8mmCRSvPSG1JgABxB5DNyJg
//     // 1575288000
//     // 1749739726
//     const currentRange = getCurrentRange(selectedRange);
//     const fromTimestamp = getUnixTime(new Date(currentRange.startDate));
//     const toTimestamp = getUnixTime(new Date(currentRange.endDate));
//     const response = await fetch(
//         `https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart/range?vs_currency=${localCurrency}&from=${fromTimestamp}&to=${toTimestamp}`,
//     );
//     const fetchedData = (await response.json()) as ApiData;
//
//     return sanitizeCoinData(fetchedData, selectedRange);
// };

type UseFetchFiatRatesProps = {
    selectedRange: GraphRange;
    account: Account;
    localCurrency: FiatCurrencyCode;
};

export const useFetchFiatRates = ({
    account,
    selectedRange,
    localCurrency,
}: UseFetchFiatRatesProps) => {
    const [fiatRates, setFiatRates] = useState<RawDataItem[]>([]);
    const [hasError, _setHasError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // const currentRange = getCurrentRange(selectedRange);

    useEffect(() => {
        // const fromTimestamp = getUnixTime(new Date(currentRange.startDate));
        // const toTimestamp = getUnixTime(new Date(currentRange.endDate));
        // const granularity = Math.round((toTimestamp - fromTimestamp) / VISIBLE_TIMESLOTS_IN_CHART);
        const granularity = 86400;
        console.log('___', { granularity, selectedRange });
        const fetchFiatRates = async () => {
            const connectBalanceHistory = await TrezorConnect.blockchainGetAccountBalanceHistory({
                coin: account.symbol,
                identity: tryGetAccountIdentity(account),
                descriptor: account.descriptor,
                from: selectedRange.startDate ? getUnixTime(selectedRange.startDate) : undefined,
                to: selectedRange.endDate ? getUnixTime(selectedRange.endDate) : undefined,
                groupBy: granularity,
                currencies: [localCurrency],
            });

            console.log('___fetchFiatRates', connectBalanceHistory);
            // if (connectBalanceHistory?.success === true) {
            //     if (connectBalanceHistory.payload.length === 0) {
            //         setStartBalance(0);
            //     }
            //     const value =
            //         (parseFloat(connectBalanceHistory.payload[0].received) -
            //             parseFloat(connectBalanceHistory.payload[0].sent)) /
            //         SATS_TO_BTC;
            //     // const rate = connectBalanceHistory.payload[0].rates[localCurrency] || 1;
            //     setStartBalance(value);
            // } else {
            //     console.log('___ERROR', connectBalanceHistory);
            //     setHasError(true);
            // }
            setIsLoading(false);
        };
        setIsLoading(true);
        fetchFiatRates();
        setFiatRates(fetchMockData(selectedRange)); //mock
    }, [account, localCurrency, selectedRange]);

    return { fiatRates, hasError, isLoading };
};

// const fetchDataFromBlockbook = async ({
//     selectedRange,
//     localCurrency,
// }: {
//     selectedRange: GraphRange;
//     localCurrency: string;
// }) => {
//     // const granularity = (toTimestamp - fromTimestamp) / VISIBLE_TIMESLOTS_IN_CHART;
//     // const fromTimestamp = getUnixTime(selectedRange.startDate);
//     // const toTimestamp = getUnixTime(selectedRange.endDate);
// };

// export const useFetchFiatRates = ({ selectedRange }: UseFetchFiatRates) => {
//     const [fiatRates, setFiatRates] = useState<RawDataItem[]>([]);
//     const [isLoading, setIsLoading] = useState<boolean>(false);
//     // const localCurrency = useSelector(selectLocalCurrency);
//
//     useEffect(() => {
//         setIsLoading(true);
//         setFiatRates(fetchMockData(selectedRange));
//         setTimeout(() => {
//             setIsLoading(false);
//         }, 300);
//         // setFiatRates(await fetchData(selectedRange,localCurrency).catch(console.error)); // tohle je možná blbě
//         fetchDataFromBlockbook({ selectedRange, localCurrency });
//     }, [selectedRange]);
//
//     return { fiatRates, isLoading };
// };
