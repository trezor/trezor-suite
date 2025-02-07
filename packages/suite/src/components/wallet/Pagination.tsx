import { useMemo } from 'react';

import styled, { css } from 'styled-components';

import { Button } from '@trezor/components';
import { borders, spacingsPx, typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';

const Wrapper = styled.div<{ $hasPages?: boolean }>`
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: ${$hasPages => ($hasPages ? spacingsPx.xs : spacingsPx.xxxs)};
`;

const PageItem = styled.div<{ $isActive?: boolean }>`
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

    ${({ $isActive, theme }) =>
        !$isActive &&
        css`
            &:hover {
                background: ${theme.backgroundTertiaryDefaultOnElevation0};
                color: ${theme.textOnTertiary};
            }
        `};
`;

const Actions = styled.div<{ $isActive: boolean }>`
    display: flex;
    visibility: ${props => (props.$isActive ? 'auto' : 'hidden')};
    ${typography.callout};
`;

const LIMITED_NUMBER_OF_NEXT_VISIBLE_PAGES = 2;

interface PaginationProps {
    currentPage: number;
    isLastPage?: boolean;
    hasPages?: boolean;
    perPage: number;
    totalItems: number;
    isPageListLimited?: boolean;
    onPageSelected: (page: number) => void;
}

export const Pagination = ({
    currentPage,
    onPageSelected,
    hasPages = true,
    isLastPage,
    perPage,
    totalItems,
    isPageListLimited,
    ...rest
}: PaginationProps) => {
    const totalPages = Math.ceil(totalItems / perPage);
    const showPrevious = currentPage > 1;
    // array of int used for creating all page buttons
    const calculatedPages = useMemo(
        () => [...Array(totalPages)].map((_p, i) => i + 1),
        [totalPages],
    );

    if (!hasPages) {
        return (
            <Wrapper $hasPages={hasPages} {...rest}>
                <Actions $isActive={showPrevious}>
                    <Button
                        onClick={() => onPageSelected(currentPage - 1)}
                        icon="caretLeft"
                        iconAlignment="left"
                        variant="tertiary"
                    >
                        <Translation id="TR_PAGINATION_NEWER" />
                    </Button>
                </Actions>
                <Actions $isActive={!isLastPage}>
                    <Button
                        onClick={() => onPageSelected(currentPage + 1)}
                        icon="caretRight"
                        iconAlignment="right"
                        variant="tertiary"
                    >
                        <Translation id="TR_PAGINATION_OLDER" />
                    </Button>
                </Actions>
            </Wrapper>
        );
    }

    return (
        <Wrapper $hasPages={hasPages} {...rest}>
            <Actions $isActive={showPrevious}>
                {currentPage > 2 && <PageItem onClick={() => onPageSelected(1)}>«</PageItem>}
                <PageItem onClick={() => onPageSelected(currentPage - 1)}>‹</PageItem>
            </Actions>

            {totalPages ? (
                calculatedPages
                    .slice(
                        0,
                        isPageListLimited
                            ? currentPage + LIMITED_NUMBER_OF_NEXT_VISIBLE_PAGES
                            : calculatedPages.length,
                    )
                    .map(i => (
                        <PageItem
                            key={i}
                            data-testid={`@wallet/accounts/pagination/${i}`}
                            data-test-activated={i === currentPage}
                            onClick={() => onPageSelected(i)}
                            $isActive={i === currentPage}
                        >
                            {i}
                        </PageItem>
                    ))
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

            <Actions $isActive={currentPage < (totalPages || 1)}>
                <PageItem onClick={() => onPageSelected(currentPage + 1)}>›</PageItem>
                {totalPages && totalPages > 2 && !isPageListLimited && (
                    <PageItem onClick={() => onPageSelected(totalPages)}>»</PageItem>
                )}
            </Actions>
        </Wrapper>
    );
};
