import { GraphRange } from '../../../../../types/wallet/graph';
import { sanitizeCoinData } from './utils';
import { demoData } from './data';
import { ApiData, RawDataItem } from './types';
import { getCurrentRange } from '../../../../../views/wallet/transactions/components/useGraphData';
import { useEffect, useState } from 'react';
import { getUnixTime, isAfter, isBefore } from 'date-fns';

type UseFetchFiatRates = {
    selectedRange: GraphRange;
};

const fetchMockData = (selectedRange: GraphRange) => {
    const currentRange = getCurrentRange(selectedRange);
    const rawData = sanitizeCoinData(demoData, selectedRange);
    const filteredRawData = rawData.filter(
        item =>
            isBefore(new Date(item.date), new Date(currentRange.endDate)) &&
            isAfter(new Date(item.date), new Date(currentRange.startDate)),
    );

    return filteredRawData;
};

const fetchData = async (selectedRange: GraphRange, localCurrency: string) => {
    //getBalanceHistory
    // zpub6rpZ3Q1MYUfqGRRDjsjMLxQ1NiTanLrbeJDRaqf7PdMnPW4dpnUaAcNLQRZyebJCoV6WUBfXQieDikrWMKqk8mmCRSvPSG1JgABxB5DNyJg
    // 1575288000
    // 1749739726
    const currentRange = getCurrentRange(selectedRange);
    const fromTimestamp = getUnixTime(new Date(currentRange.startDate));
    const toTimestamp = getUnixTime(new Date(currentRange.endDate));
    const response = await fetch(
        `https://cdn.trezor.io/dynamic/coingecko/api/v3/coins/bitcoin/market_chart/range?vs_currency=${localCurrency}&from=${fromTimestamp}&to=${toTimestamp}`,
    );
    const fetchedData = (await response.json()) as ApiData;

    return sanitizeCoinData(fetchedData, selectedRange);
};

export const useFetchFiatRates = ({ selectedRange }: UseFetchFiatRates) => {
    const [fiatRates, setFiatRates] = useState<RawDataItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // const localCurrency = useSelector(selectLocalCurrency);

    useEffect(() => {
        setIsLoading(true);
        setFiatRates(fetchMockData(selectedRange));
        setTimeout(() => {
            setIsLoading(false);
        }, 300);
        // setFiatRates(await fetchData(selectedRange,localCurrency).catch(console.error)); // tohle je možná blbě
    }, [selectedRange]);

    return { fiatRates, isLoading };
};
