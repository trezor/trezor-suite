import { useCallback, useState } from 'react';

interface PaginationProps {
    pageSize: number;
    initialPage: number;
}

function calcOffset(page: number, pageSize: number): number {
    return (page - 1) * pageSize;
}

export function usePagination({ pageSize = 10, initialPage = 1 }: PaginationProps) {
    const [page, setPage] = useState(initialPage);
    const [offset, setOffset] = useState(() => calcOffset(initialPage, pageSize));
    const [totalCount, setTotalCount] = useState<number>(0);

    const changePage = useCallback(
        (page: number) => {
            setOffset(calcOffset(page, pageSize));
            setPage(page);
        },
        [pageSize],
    );

    return {
        offset,

        page,
        changePage,
        pageSize,

        totalCount,
        setTotalCount,

        isLastPage: totalCount <= offset + pageSize,
        showPagination: totalCount > pageSize,
    };
}

export type UsePagination = ReturnType<typeof usePagination>;
