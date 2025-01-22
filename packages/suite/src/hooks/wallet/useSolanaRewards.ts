import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    EverstakeRewardsEndpointType,
    StakeAccountRewards,
    StakeRootState,
    fetchEverstakeRewards,
    selectStakingRewards,
} from '@suite-common/wallet-core';
import { useDebounce } from '@trezor/react-utils';

import { Account } from 'src/types/wallet';

const PAGE_SIZE_DEFAULT = 10;

export const useSolanaRewards = (account: Account) => {
    const { data, isLoading } =
        useSelector((state: StakeRootState) => selectStakingRewards(state, account.symbol)) || {};

    const { rewards } = data ?? {};
    const selectedAccountRewards = rewards?.[account.descriptor];

    const dispatch = useDispatch();
    const debounce = useDebounce();

    const itemsPerPage = PAGE_SIZE_DEFAULT;
    const startPage = 1;

    const [currentPage, setSelectedPage] = useState(startPage);
    const [slicedRewards, setSlicedRewards] = useState<StakeAccountRewards[]>([]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const stopIndex = startIndex + itemsPerPage;

    const fetchRewards = useCallback(
        async ({ symbol, descriptor }: Account) => {
            const controller = new AbortController();
            await debounce(() => {
                if (symbol !== 'sol') return;
                dispatch(
                    fetchEverstakeRewards({
                        symbol,
                        endpointType: EverstakeRewardsEndpointType.GetRewards,
                        address: descriptor,
                        signal: controller.signal,
                    }),
                );
            });

            return () => controller.abort();
        },
        [dispatch, debounce],
    );

    useEffect(() => {
        fetchRewards(account);
    }, [account, fetchRewards]);

    useEffect(() => {
        if (selectedAccountRewards) {
            const slicedRewards = selectedAccountRewards?.slice(startIndex, stopIndex);
            setSlicedRewards(slicedRewards);
        }
    }, [currentPage, selectedAccountRewards, startIndex, stopIndex]);

    useEffect(() => {
        // reset page on account change
        setSelectedPage(startPage);
    }, [account.descriptor, account.symbol, startPage]);

    const totalItems = selectedAccountRewards?.length ?? 0;
    const showPagination = totalItems > itemsPerPage;
    const isLastPage = stopIndex >= totalItems;

    return {
        slicedRewards,
        isLoading,
        currentPage,
        setSelectedPage,
        totalItems,
        itemsPerPage,
        showPagination,
        isLastPage,
        fetchRewards,
    };
};
