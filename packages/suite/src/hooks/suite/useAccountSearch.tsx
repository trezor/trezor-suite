import { createContext, useContext, useMemo, useState } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Account } from '@suite-common/wallet-types';

import * as accountSearchActions from 'src/actions/wallet/accountSearchActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

type AccountSearchContextType = {
    coinFilter: Account['symbol'] | undefined;
    searchString: string | undefined;
    selectedNetwork: NetworkSymbol | undefined;
    setCoinFilter: (filter?: Account['symbol']) => void;
    setSearchString: (search?: string) => void;
    setSelectedNetwork: (network?: NetworkSymbol) => void;
};

const AccountSearchContext = createContext<AccountSearchContextType>({
    coinFilter: undefined,
    searchString: '',
    selectedNetwork: undefined,
    setCoinFilter: () => {},
    setSearchString: () => {},
    setSelectedNetwork: () => {},
});

export const LocalAccountSearchProvider = ({ children }: { children: React.ReactNode }) => {
    const [coinFilter, setCoinFilter] = useState<Account['symbol'] | undefined>(undefined);
    const [searchString, setSearchString] = useState<string | undefined>(undefined);
    const [selectedNetwork, setSelectedNetwork] =
        useState<AccountSearchContextType['selectedNetwork']>(undefined);

    return (
        <AccountSearchContext.Provider
            value={{
                coinFilter,
                searchString,
                selectedNetwork,
                setCoinFilter,
                setSearchString,
                setSelectedNetwork,
            }}
        >
            {children}
        </AccountSearchContext.Provider>
    );
};

export const ReduxAccountSearchProvider = ({ children }: { children: React.ReactNode }) => {
    const { coinFilter, searchString, selectedNetwork } = useSelector(
        state => state.wallet.accountSearch,
    );
    const dispatch = useDispatch();

    const actions = useMemo(
        () => ({
            setCoinFilter: (filter?: Account['symbol']) =>
                dispatch(accountSearchActions.setCoinFilter(filter)),
            setSearchString: (search?: string) =>
                dispatch(accountSearchActions.setSearchString(search)),
            setSelectedNetwork: (network?: NetworkSymbol) =>
                dispatch(accountSearchActions.setSelectedNetwork(network)),
        }),
        [dispatch],
    );

    const value = {
        coinFilter,
        searchString,
        selectedNetwork,
        ...actions,
    };

    return <AccountSearchContext.Provider value={value}>{children}</AccountSearchContext.Provider>;
};

export const useAccountSearch = (): AccountSearchContextType => useContext(AccountSearchContext);
