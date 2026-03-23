import { createContext, useContext, useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';

import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    accountSearchActions,
    selectAccountSearch,
} from 'src/reducers/wallet/accountSearchReducer';

type AccountSearchContextType = {
    coinFilter: NetworkSymbol[];
    searchString: string | undefined;
    toggleCoinFilter: (symbol: NetworkSymbol) => void;
    setCoinFilter: (filter: NetworkSymbol[]) => void;
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
            toggleCoinFilter: (symbol: NetworkSymbol) =>
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
