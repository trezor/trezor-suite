import { createContext, useContext, useMemo, useState } from 'react';

import { Account } from '@suite-common/wallet-types';

import * as accountSearchActions from 'src/actions/wallet/accountSearchActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

type AccountSearchContextType = {
    coinFilter: Account['symbol'] | undefined;
    searchString: string | undefined;
    setCoinFilter: (filter?: Account['symbol']) => void;
    setSearchString: (search?: string) => void;
};

const AccountSearchContext = createContext<AccountSearchContextType>({
    coinFilter: undefined,
    searchString: '',
    setCoinFilter: () => {},
    setSearchString: () => {},
});

export const LocalAccountSearchProvider = ({ children }: { children: React.ReactNode }) => {
    const [coinFilter, setCoinFilter] = useState<Account['symbol'] | undefined>(undefined);
    const [searchString, setSearchString] = useState<string | undefined>(undefined);

    return (
        <AccountSearchContext.Provider
            value={{ coinFilter, searchString, setCoinFilter, setSearchString }}
        >
            {children}
        </AccountSearchContext.Provider>
    );
};

export const ReduxAccountSearchProvider = ({ children }: { children: React.ReactNode }) => {
    const { coinFilter, searchString } = useSelector(state => state.wallet.accountSearch);
    const dispatch = useDispatch();

    const actions = useMemo(
        () => ({
            setCoinFilter: (filter?: Account['symbol']) =>
                dispatch(accountSearchActions.setCoinFilter(filter)),
            setSearchString: (search?: string) =>
                dispatch(accountSearchActions.setSearchString(search)),
        }),
        [dispatch],
    );

    const value = {
        coinFilter,
        searchString,
        ...actions,
    };

    return <AccountSearchContext.Provider value={value}>{children}</AccountSearchContext.Provider>;
};

export const useAccountSearch = (): AccountSearchContextType => useContext(AccountSearchContext);
