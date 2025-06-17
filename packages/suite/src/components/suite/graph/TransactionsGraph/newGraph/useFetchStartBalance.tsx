import { useEffect, useState } from 'react';

import { Account } from '@suite-common/wallet-types/libDev/src';
import { tryGetAccountIdentity } from '@suite-common/wallet-utils';
import TrezorConnect from '@trezor/connect';

import { GraphRange } from '../../../../../types/wallet/graph';
import { getCurrentRange } from '../../../../../views/wallet/transactions/components/useGraphData';

const SATS_TO_BTC = 100000000;

type UseFetchStartBalance = {
    selectedRange: GraphRange;
    account: Account;
};

export const useFetchStartBalance = ({ account, selectedRange }: UseFetchStartBalance) => {
    const [startBalance, setStartBalance] = useState<number | null>(null);
    const [hasError, setHasError] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const currentRange = getCurrentRange(selectedRange);

    useEffect(() => {
        const fetchStartBalance = async () => {
            const connectBalanceHistory = await TrezorConnect.blockchainGetAccountBalanceHistory({
                coin: account.symbol,
                identity: tryGetAccountIdentity(account),
                descriptor: account.descriptor,
                to: new Date(currentRange.endDate).getTime(),
                groupBy: 1000000000,
                currencies: ['usd'],
            });

            const value =
                connectBalanceHistory?.success === true
                    ? ((parseFloat(connectBalanceHistory.payload[0]?.received) || 0) -
                          (parseFloat(connectBalanceHistory.payload[0]?.sent) || 0)) /
                      SATS_TO_BTC
                    : null;

            console.log(
                '___',
                parseFloat(connectBalanceHistory.payload[0]?.received) || 0,
                parseFloat(connectBalanceHistory.payload[0]?.sent) || 0,
                (parseFloat(connectBalanceHistory.payload[0]?.received) || 0) -
                    (parseFloat(connectBalanceHistory.payload[0]?.sent) || 0),
            );
            if (value === null) {
                setHasError(true);
            } else {
                setStartBalance(value);
            }
            console.log('___', { connectBalanceHistory, value });
            setIsLoading(false);
        };
        setIsLoading(true);
        fetchStartBalance();
    }, [account, currentRange.endDate]);

    return { startBalance, hasError, isLoading };
};
