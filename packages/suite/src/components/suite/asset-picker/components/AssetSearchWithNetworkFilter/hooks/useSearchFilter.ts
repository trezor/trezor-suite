import { useState } from 'react';
import { useDebounce } from 'react-use';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';

export function useSearchFilter() {
    const defaultSearch = useSelector(globalSendReceiveFilters.selectors.selectSearch);
    const [search, setSearch] = useState(defaultSearch);
    const dispatch = useDispatch();

    useDebounce(
        () => {
            if (search !== defaultSearch) {
                dispatch(globalSendReceiveFilters.actions.setSearch(search));
            }
        },
        100,
        [search, dispatch, defaultSearch],
    );

    return [search, setSearch] as const;
}
