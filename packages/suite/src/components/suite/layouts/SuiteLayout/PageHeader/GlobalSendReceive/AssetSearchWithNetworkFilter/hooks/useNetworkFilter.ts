import { type RefObject, useEffect, useMemo, useState } from 'react';

import { gotoThunk, parseDashboardParams, selectRouterParams } from '@suite/router';
import { useDispatch } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectEnabledNetworks } from '@suite-common/wallet-core';
import { type GlobalSendReceiveType } from '@suite-common/wallet-types';

import { useSelector } from 'src/hooks/suite';
import {
    globalSendReceiveFiltersActions,
    globalSendReceiveFiltersSelectors,
} from 'src/slices/wallet/globalSendReceiveFilters';

export interface UseNetworkFilterProps {
    modal?: NonNullable<GlobalSendReceiveType>;
    listRef: RefObject<HTMLDivElement | null>;
    resetSearch: () => void;
    availableNetworks?: readonly NetworkSymbol[];
    shouldResetSearchOnNetworkChange?: boolean;
}

export function useNetworkFilter({
    listRef,
    resetSearch,
    modal,
    availableNetworks,
    shouldResetSearchOnNetworkChange = true,
}: UseNetworkFilterProps) {
    const routerParams = useSelector(selectRouterParams);
    const networkSymbolUrlParam = useMemo(
        () => parseDashboardParams(routerParams)?.networkSymbol,
        [routerParams],
    );

    const defaultNetwork = useSelector(globalSendReceiveFiltersSelectors.selectNetworkSymbol);
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const selectableNetworks = availableNetworks ?? enabledNetworks;
    const [networkFilter, setNetworkFilter] = useState<NetworkSymbol | undefined>(defaultNetwork);

    const dispatch = useDispatch();

    useEffect(() => {
        // Only preselect a network from the URL when it is available in the current picker,
        // otherwise the list is hidden behind a filter the user never chose.
        if (
            networkSymbolUrlParam &&
            defaultNetwork === undefined &&
            selectableNetworks.includes(networkSymbolUrlParam)
        ) {
            setNetworkFilter(networkSymbolUrlParam);
        }
    }, [networkSymbolUrlParam, defaultNetwork, selectableNetworks]);

    useEffect(() => {
        if (networkFilter && !selectableNetworks.includes(networkFilter)) {
            setNetworkFilter(undefined);
        }
    }, [networkFilter, selectableNetworks]);

    useEffect(() => {
        if (networkFilter === defaultNetwork) {
            return;
        }

        if (shouldResetSearchOnNetworkChange) {
            resetSearch();
        }

        dispatch(globalSendReceiveFiltersActions.setNetworkSymbol(networkFilter));

        dispatch(
            gotoThunk({
                routeName: 'suite-index',
                params: {
                    modal,
                    ...(networkFilter ? { networkSymbol: networkFilter } : {}),
                },
            }),
        );

        requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: 0, behavior: 'instant' });
        });
    }, [
        defaultNetwork,
        dispatch,
        listRef,
        networkFilter,
        resetSearch,
        modal,
        shouldResetSearchOnNetworkChange,
    ]);

    return [networkFilter, setNetworkFilter] as const;
}
