import { RefObject, useEffect, useMemo, useState } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { GlobalSendReceiveType } from '@suite-common/wallet-types';

import { goto } from 'src/actions/suite/routerActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';
import { parseDashboardParams } from 'src/utils/suite/routerParams';

export interface UseNetworkFilterProps {
    modal?: NonNullable<GlobalSendReceiveType>;
    listRef: RefObject<HTMLDivElement | null>;
    resetSearch: () => void;
}

export function useNetworkFilter({ listRef, resetSearch, modal }: UseNetworkFilterProps) {
    const routerParams = useSelector(state => state.router.params);
    const networkSymbolUrlParam = useMemo(
        () => parseDashboardParams(routerParams)?.networkSymbol,
        [routerParams],
    );

    const defaultNetwork = useSelector(globalSendReceiveFilters.selectors.selectNetworkSymbol);
    const [networkFilter, setNetworkFilter] = useState<NetworkSymbol | undefined>(defaultNetwork);

    const dispatch = useDispatch();

    useEffect(() => {
        if (networkSymbolUrlParam && defaultNetwork === undefined) {
            setNetworkFilter(networkSymbolUrlParam);
        }
    }, [networkSymbolUrlParam, defaultNetwork]);

    useEffect(() => {
        if (networkFilter === defaultNetwork) {
            return;
        }

        resetSearch();

        dispatch(globalSendReceiveFilters.actions.setNetworkSymbol(networkFilter));

        dispatch(
            goto('suite-index', {
                params: {
                    modal,
                    ...(networkFilter ? { networkSymbol: networkFilter } : {}),
                },
            }),
        );

        requestAnimationFrame(() => {
            listRef.current?.scrollTo({ top: 0, behavior: 'instant' });
        });
    }, [defaultNetwork, dispatch, listRef, networkFilter, resetSearch, modal]);

    return [networkFilter, setNetworkFilter] as const;
}
