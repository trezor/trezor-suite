import { type ReactNode, createContext, useContext } from 'react';

import { selectHistoricFiatRates } from '@suite-common/wallet-core';
import type {
    CryptoBaseCurrencyPair,
    RatesByTimestamps,
    Timestamp,
} from '@suite-common/wallet-types';
import { roundTimestampToNearestPastHour } from '@suite-common/wallet-utils';

import { useSelector } from 'src/hooks/suite';

const HistoricFiatRatesContext = createContext<RatesByTimestamps | null>(null);

type HistoricFiatRatesProviderProps = {
    /** `null` keeps the rates the wallet stores. */
    rates: RatesByTimestamps | null;
    children: ReactNode;
};

/** Past rates for the transactions rendered below, when they do not come from the wallet store. */
export const HistoricFiatRatesProvider = ({ rates, children }: HistoricFiatRatesProviderProps) => (
    <HistoricFiatRatesContext.Provider value={rates}>{children}</HistoricFiatRatesContext.Provider>
);

/** Past rates of the transactions being rendered, by rate key and hour. */
export const useHistoricFiatRates = (): RatesByTimestamps => {
    const providedRates = useContext(HistoricFiatRatesContext);
    const storedRates = useSelector(selectHistoricFiatRates);

    return providedRates ?? storedRates;
};

/** The past rate for one rate key at a transaction's time, if known. */
export const useHistoricFiatRateAt = (
    fiatRateKey: CryptoBaseCurrencyPair,
    timestamp: Timestamp | undefined,
): number | undefined => {
    const rates = useHistoricFiatRates();

    return timestamp === undefined
        ? undefined
        : rates[fiatRateKey]?.[roundTimestampToNearestPastHour(timestamp)];
};
