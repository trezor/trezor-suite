import { useState } from 'react';
import { useDebounce } from 'react-use';

import { useServices } from '@suite-common/dependency-injection';
import { selectDispatch } from '@suite-common/redux-utils';

import { useSelector } from 'src/hooks/suite';
import {
    globalSendReceiveFiltersActions,
    globalSendReceiveFiltersSelectors,
} from 'src/slices/wallet/globalSendReceiveFilters';

export function useSearchFilter() {
    const defaultSearch = useSelector(globalSendReceiveFiltersSelectors.selectSearch);
    const [search, setSearch] = useState(defaultSearch);
    const { dispatch } = useServices(selectDispatch);

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
