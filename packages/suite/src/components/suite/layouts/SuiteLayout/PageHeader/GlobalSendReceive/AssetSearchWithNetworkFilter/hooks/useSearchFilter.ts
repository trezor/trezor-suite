import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDebounce } from 'react-use';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';

import {
    globalSendReceiveFiltersActions,
    globalSendReceiveFiltersSelectors,
} from 'src/slices/wallet/globalSendReceiveFilters';

export function useSearchFilter() {
    const defaultSearch = useSelector(globalSendReceiveFiltersSelectors.selectSearch);
    const [search, setSearch] = useState(defaultSearch);
    const { dispatch } = useServices(injectDispatch);

    useEffect(() => {
        setSearch(defaultSearch);
    }, [defaultSearch]);

    useDebounce(
        () => {
            if (search !== defaultSearch) {
                dispatch(globalSendReceiveFiltersActions.setSearch(search));
            }
        },
        100,
        [search, dispatch, defaultSearch],
    );

    return [search, setSearch] as const;
}
