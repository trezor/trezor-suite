import { useEffect, useState } from 'react';

import { getUnixTime } from 'date-fns';

import { FiatCurrencyCode } from '@suite-common/suite-config/libDev/src';
import { Account } from '@suite-common/wallet-types/libDev/src';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { GraphRange } from '../../../../../types/wallet/graph';

const SATS_TO_BTC = 100000000;

type UseFetchStartBalance = {
    selectedRange: GraphRange;
    account: Account;
    localCurrency: FiatCurrencyCode;
};

export const useFetchStartBalance = ({
    account,
    selectedRange,
    localCurrency,
}: UseFetchStartBalance) => {
    const [startBalance, setStartBalance] = useState<number | null>(null);
    const [hasError, setHasError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // const currentRange = getCurrentRange(selectedRange);

    useEffect(() => {
        const fetchStartBalance = async () => {
            const connectBalanceHistory = await TrezorConnect.blockchainGetAccountBalanceHistory({
                coin: account.symbol,
                identity: tryGetAccountIdentity(account),
                descriptor: account.descriptor,
                to: selectedRange.startDate ? getUnixTime(selectedRange.startDate) : undefined,
                groupBy: 1000000000,
                currencies: [localCurrency],
            });

            if (connectBalanceHistory?.success === true) {
                if (connectBalanceHistory.payload.length === 0) {
                    setStartBalance(0);
                }
                const value =
                    (parseFloat(connectBalanceHistory.payload[0].received) -
                        parseFloat(connectBalanceHistory.payload[0].sent)) /
                    SATS_TO_BTC;
                // const rate = connectBalanceHistory.payload[0].rates[localCurrency] || 1;
                setStartBalance(value);
            } else {
                console.log('___ERROR', connectBalanceHistory);
                setHasError(true);
            }

            setIsLoading(false);
        };
        setIsLoading(true);
        fetchStartBalance();
    }, [account, localCurrency, selectedRange.startDate]);

    return { startBalance, hasError, isLoading };
};
