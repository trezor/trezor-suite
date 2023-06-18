import React, { useMemo } from 'react';
import { variables } from '@trezor/components';
import { Translation } from 'src/components/suite';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
`;

const PageItem = styled.div<{ isActive?: boolean }>`
    cursor: pointer;
    font-size: ${variables.FONT_SIZE.SMALL};
    background: ${props => (props.isActive ? props.theme.BG_GREEN : 'transparent')};
    color: ${props => (props.isActive ? props.theme.TYPE_WHITE : props.theme.TYPE_GREEN)};
    padding: 4px 8px;
    border-radius: 2px;
`;

const Actions = styled.div<{ isActive: boolean }>`
    display: flex;
    visibility: ${props => (props.isActive ? 'auto' : 'hidden')};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

interface Props {
    currentPage: number;
    isLastPage?: boolean;
    hasPages?: boolean;
    perPage: number;
    totalItems: number;
    onPageSelected: (page: number) => void;
}

export const Pagination = ({
    currentPage,
    onPageSelected,
    hasPages = true,
    isLastPage,
    perPage,
    totalItems,
    ...rest
}: Props) => {
    const totalPages = Math.ceil(totalItems / perPage);
    const showPrevious = currentPage > 1;
    // array of int used for creating all page buttons
    const calculatedPages = useMemo(
        () => [...Array(totalPages)].map((_p, i) => i + 1),
        [totalPages],
    );

    if (!hasPages) {
        return (
            <Wrapper {...rest}>
                <Actions isActive={showPrevious}>
                    <PageItem onClick={() => onPageSelected(currentPage - 1)}>
                        ‹ <Translation id="TR_PAGINATION_NEWER" />
                    </PageItem>
                </Actions>
                <Actions isActive={!isLastPage}>
                    <PageItem onClick={() => onPageSelected(currentPage + 1)}>
                        <Translation id="TR_PAGINATION_OLDER" /> ›
                    </PageItem>
                </Actions>
            </Wrapper>
        );
    }

    return (
        <Wrapper {...rest}>
            <Actions isActive={showPrevious}>
                <PageItem onClick={() => onPageSelected(1)}>«</PageItem>
                <PageItem onClick={() => onPageSelected(currentPage - 1)}>‹</PageItem>
            </Actions>
            {totalPages ? (
                calculatedPages.map(i => (
                    <PageItem
                        key={i}
                        data-test={`@wallet/accounts/pagination/${i}`}
                        data-test-activated={i === currentPage ?? 'true'}
                        onClick={() => onPageSelected(i)}
                        isActive={i === currentPage}
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
                            // eslint-disable-next-line react/no-array-index-key
                            key={i}
                            data-test={`@wallet/accounts/pagination/${i + 1}`}
                            onClick={() => onPageSelected(i + 1)}
                        >
                            {i + 1}
                        </PageItem>
                    ))}
                    <PageItem onClick={() => onPageSelected(currentPage)} isActive>
                        {currentPage}
                    </PageItem>
                </>
            )}
            <Actions isActive={currentPage < (totalPages || 1)}>
                <PageItem onClick={() => onPageSelected(currentPage + 1)}>›</PageItem>
                {totalPages && <PageItem onClick={() => onPageSelected(totalPages)}>»</PageItem>}
            </Actions>
        </Wrapper>
    );
};
