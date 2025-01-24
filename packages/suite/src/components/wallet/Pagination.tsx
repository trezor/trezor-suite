import { useMemo } from 'react';

import styled, { css } from 'styled-components';

import { borders, spacingsPx, typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: ${spacingsPx.xxxs};
`;

const Ellipsis = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${spacingsPx.xxl};
    height: ${spacingsPx.xxl};
    padding: ${spacingsPx.xxs} ${spacingsPx.xs};
    text-align: center;
    ${typography.hint};
`;

const PageItem = styled.div<{ $isActive?: boolean; $isDisabled?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${spacingsPx.xxl};
    height: ${spacingsPx.xxl};
    padding: ${spacingsPx.xxs} ${spacingsPx.xs};
    background: ${({ $isActive, theme }) =>
        $isActive ? theme.backgroundSecondaryDefault : 'transparent'};
    text-align: center;
    color: ${({ $isActive, theme }) => $isActive && theme.textOnSecondary};
    border-radius: ${borders.radii.md};
    transition:
        background 0.15s ease-out,
        color 0.15s ease-out;
    ${typography.hint};
    cursor: pointer;

    ${({ $isActive, $isDisabled, theme }) =>
        !$isActive &&
        !$isDisabled &&
        css`
            &:hover {
                background: ${theme.backgroundTertiaryDefaultOnElevation0};
                color: ${theme.textOnTertiary};
            }
        `};

    ${({ $isDisabled }) =>
        $isDisabled &&
        css`
            color: ${({ theme }) => theme.textDisabled};
            cursor: not-allowed;
        `};
`;

const Actions = styled.div<{ $isActive: boolean }>`
    display: flex;
    visibility: ${props => (props.$isActive ? 'auto' : 'hidden')};
    ${typography.callout};
`;

interface PaginationProps {
    currentPage: number;
    isLastPage?: boolean;
    hasPages?: boolean;
    perPage: number;
    totalItems: number;
    onPageSelected: (page: number) => void;
}

const SLIDING_WINDOW_SIZE = 7; // should be an even number, so that the active page can be centered
const calculatePages = ({
    currentPage,
    totalPages,
}: {
    currentPage: number;
    totalPages: number;
}) => {
    const calculatedPages: (number | null)[] = [];

    // center the current page
    let windowBeginning = currentPage - Math.floor((SLIDING_WINDOW_SIZE - 1) / 2);

    // prevent window overflow on the right
    if (windowBeginning + SLIDING_WINDOW_SIZE > totalPages)
        windowBeginning = totalPages - (SLIDING_WINDOW_SIZE - 1);

    // prevent window overflow on the left
    if (windowBeginning < 1) windowBeginning = 1;

    for (
        let page = windowBeginning;
        page < windowBeginning + SLIDING_WINDOW_SIZE && page <= totalPages;
        page++
    ) {
        const indexInWindow = calculatedPages.length;

        // first button override
        if (indexInWindow === 0) {
            calculatedPages.push(1);
            continue;
        }

        // second button override
        if (indexInWindow === 1 && page !== 2) {
            calculatedPages.push(null);
            continue;
        }

        // second to last button override
        if (
            indexInWindow === SLIDING_WINDOW_SIZE - 2 &&
            page !== totalPages - 1 &&
            totalPages > SLIDING_WINDOW_SIZE
        ) {
            calculatedPages.push(null);
            continue;
        }

        // last button override
        if (indexInWindow === SLIDING_WINDOW_SIZE - 1 && page !== totalPages) {
            calculatedPages.push(totalPages);
            continue;
        }

        calculatedPages.push(page);
    }

    return calculatedPages;
};

export const Pagination = ({
    currentPage,
    onPageSelected,
    hasPages = true,
    isLastPage: _isLastPage,
    perPage,
    totalItems,
    ...rest
}: PaginationProps) => {
    const totalPages = Math.ceil(totalItems / perPage);
    const isFirstPage = currentPage === 1;
    const isLastPage = hasPages ? currentPage === totalPages : _isLastPage;

    // array of pages to be rendered as buttons
    const calculatedPages = useMemo(
        () => calculatePages({ currentPage, totalPages }),
        [currentPage, totalPages],
    );

    if (!hasPages) {
        return (
            <Wrapper {...rest}>
                <Actions $isActive={!isFirstPage}>
                    <PageItem onClick={() => onPageSelected(currentPage - 1)}>
                        ‹ <Translation id="TR_PAGINATION_NEWER" />
                    </PageItem>
                </Actions>
                <Actions $isActive={!isLastPage}>
                    <PageItem onClick={() => onPageSelected(currentPage + 1)}>
                        <Translation id="TR_PAGINATION_OLDER" /> ›
                    </PageItem>
                </Actions>
            </Wrapper>
        );
    }

    return (
        <Wrapper {...rest}>
            <Actions $isActive={true}>
                <PageItem
                    $isDisabled={isFirstPage}
                    onClick={!isFirstPage ? () => onPageSelected(1) : undefined}
                >
                    «
                </PageItem>
                <PageItem
                    $isDisabled={isFirstPage}
                    onClick={!isFirstPage ? () => onPageSelected(currentPage - 1) : undefined}
                >
                    ‹
                </PageItem>
            </Actions>

            {totalPages ? (
                <>
                    {calculatedPages.map((page, i) =>
                        page === null ? (
                            <Ellipsis key={i}>…</Ellipsis>
                        ) : (
                            <PageItem
                                key={i}
                                data-testid={`@wallet/accounts/pagination/${page}`}
                                data-test-activated={page === currentPage}
                                onClick={() => onPageSelected(page)}
                                $isActive={page === currentPage}
                            >
                                {page}
                            </PageItem>
                        ),
                    )}
                </>
            ) : (
                <>
                    {[...Array(currentPage - 1)].map((_p, i) => (
                        // this is fine, read "exception from the rule"
                        // the list is never reordered/filtered, items have no ids, list/items do not change
                        // https://medium.com/@robinpokorny/index-as-a-key-is-an-anti-pattern-e0349aece318
                        <PageItem
                            key={i}
                            data-testid={`@wallet/accounts/pagination/${i + 1}`}
                            onClick={() => onPageSelected(i + 1)}
                        >
                            {i + 1}
                        </PageItem>
                    ))}
                    <PageItem onClick={() => onPageSelected(currentPage)} $isActive>
                        {currentPage}
                    </PageItem>
                </>
            )}

            <Actions $isActive={true}>
                <PageItem
                    $isDisabled={isLastPage}
                    onClick={!isLastPage ? () => onPageSelected(currentPage + 1) : undefined}
                >
                    ›
                </PageItem>
                {totalPages > 0 && (
                    <PageItem
                        $isDisabled={isLastPage}
                        onClick={!isLastPage ? () => onPageSelected(totalPages) : undefined}
                    >
                        »
                    </PageItem>
                )}
            </Actions>
        </Wrapper>
    );
};
