import { useEffect } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { unwatchAccountHistoryThunk, watchAccountHistoryThunk } from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import { selectIsWindowVisible } from 'src/reducers/suite/windowReducer';

// A backend billed per poll looks for new transactions only while someone can see the list.
export const useWatchAccountHistory = (accountKey: AccountKey | undefined) => {
    const { dispatch } = useServices(injectDispatch);
    const isWindowVisible = useSelector(selectIsWindowVisible);

    useEffect(() => {
        if (!accountKey || !isWindowVisible) return;

        dispatch(watchAccountHistoryThunk({ accountKey }));

        return () => {
            dispatch(unwatchAccountHistoryThunk({ accountKey }));
        };
    }, [accountKey, isWindowVisible, dispatch]);
};
