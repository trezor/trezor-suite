import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { TransactionCacheEngine } from '@suite-common/transaction-cache-engine';
import { selectAccounts } from '@suite-common/wallet-core';

export const useTransactionCache = () => {
    const accounts = useSelector(selectAccounts);

    useEffect(() => {
        accounts.forEach(account => {
            // TODO: add support for other coins
            if (account.networkType === 'ripple') {
                TransactionCacheEngine.addAccount({
                    coin: account.symbol,
                    descriptor: account.descriptor,
                });
            }
        });
    }, [accounts]);
};
