import { useMemo } from 'react';

import { Account } from '@suite-common/wallet-types';

import * as accountSearchActions from 'src/actions/wallet/accountSearchActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

export const useAccountSearch = () => {
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

    return {
        coinFilter,
        searchString,
        ...actions,
    };
};
