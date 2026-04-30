import { createContext, useContext, useMemo } from 'react';

import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    type AccountSearchCoinFilter,
    accountSearchActions,
    selectAccountSearch,
} from 'src/reducers/wallet/accountSearchReducer';

type AccountSearchContextType = {
    coinFilter: AccountSearchCoinFilter[];
    searchString: string | undefined;
    toggleCoinFilter: (symbol: AccountSearchCoinFilter) => void;
    setCoinFilter: (filter: AccountSearchCoinFilter[]) => void;
    setSearchString: (search?: string) => void;
};

const AccountSearchContext = createContext<AccountSearchContextType>({
    coinFilter: [],
    searchString: '',
    toggleCoinFilter: () => {},
    setCoinFilter: () => {},
    setSearchString: () => {},
});

export function useReduxAccountSearchActions() {
    const dispatch = useDispatch();

    return useMemo(
        () => ({
            toggleCoinFilter: (symbol: AccountSearchCoinFilter) =>
                dispatch(accountSearchActions.toggleCoinFilter(symbol)),
            setCoinFilter: (filter: AccountSearchContextType['coinFilter']) =>
                dispatch(accountSearchActions.setCoinFilter(filter)),
            setSearchString: (search: AccountSearchContextType['searchString']) =>
                dispatch(accountSearchActions.setSearchString(search)),
        }),
        [dispatch],
    );
}

export const ReduxAccountSearchProvider = ({ children }: { children: React.ReactNode }) => {
    const filters = useSelector(state => selectAccountSearch(state));
    const actions = useReduxAccountSearchActions();

    return (
        <AccountSearchContext.Provider
            value={{
                ...filters,
                ...actions,
            }}
        >
            {children}
        </AccountSearchContext.Provider>
    );
};

export const useAccountSearch = (): AccountSearchContextType => useContext(AccountSearchContext);
