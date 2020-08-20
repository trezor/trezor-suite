import React, { useState } from 'react';
import { Account } from '@wallet-types';

interface AccountSearchContext {
    coinFilter: Account['symbol'] | undefined;
    setCoinFilter: (v: Account['symbol'] | undefined) => void;
}

export const CoinFilterContext = React.createContext<AccountSearchContext>({
    coinFilter: undefined,
    setCoinFilter: () => {},
});

export const useAccountSearch = () => {
    const [coinFilter, setCoinFilter] = useState<Account['symbol'] | undefined>(undefined);

    return {
        coinFilter,
        setCoinFilter,
    };
};
