import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useDebounce } from 'react-use';

import { useSelector } from '@suite-common/redux-utils';

import {
    globalSendReceiveFiltersActions,
    globalSendReceiveFiltersSelectors,
} from 'src/slices/wallet/globalSendReceiveFilters';

export function useSearchFilter() {
    const defaultSearch = useSelector(globalSendReceiveFiltersSelectors.selectSearch);
    const [search, setSearch] = useState(defaultSearch);
    const dispatch = useDispatch();

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
