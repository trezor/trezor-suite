import { createContext, useContext, useMemo } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';

import * as accountSearchActions from 'src/actions/wallet/accountSearchActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectAccountSearch } from 'src/reducers/wallet/accountSearchReducer';

type AccountSearchContextType = {
    coinFilter: NetworkSymbol | undefined;
    searchString: string | undefined;
    setCoinFilter: (filter?: NetworkSymbol) => void;
    setSearchString: (search?: string) => void;
};

const AccountSearchContext = createContext<AccountSearchContextType>({
    coinFilter: undefined,
    searchString: '',
    setCoinFilter: () => {},
    setSearchString: () => {},
});

export function useReduxAccountSearchActions() {
    const dispatch = useDispatch();

    return useMemo(
        () => ({
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
