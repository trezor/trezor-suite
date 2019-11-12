import React, { useMemo } from 'react';
import { colors, variables } from '@trezor/components';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 10px;
    flex-wrap: wrap;
`;

const PageItem = styled.div<{ isActive?: boolean }>`
    cursor: pointer;
    background: ${props => (props.isActive ? colors.GREEN_PRIMARY : 'transparent')};
    color: ${props => (props.isActive ? colors.WHITE : colors.GREEN_PRIMARY)};
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
    totalPages?: number;
    isOnLastPage?: boolean;
    onPageSelected: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageSelected, isOnLastPage }: Props) => {
    // if totalPages is 1 do not render pagination
    const showPagination = totalPages ? totalPages > 1 : false;
    if (!showPagination) {
        return null;
    }
    // if totalPages is undefined show only start/prev/next buttons
    const showNext = totalPages ? currentPage < totalPages : !isOnLastPage;
    const showPrevious = currentPage > 1;
    // array of int used for creating all page buttons
    const calculatedPages = useMemo(() => [...Array(totalPages)].map((_p, i) => i + 1), [
        totalPages,
    ]);

    return (
        <Wrapper>
            <Actions isActive={showPrevious}>
                <PageItem onClick={() => onPageSelected(1)}>«</PageItem>
                <PageItem onClick={() => onPageSelected(currentPage - 1)}>‹</PageItem>
            </Actions>
            {totalPages ? (
                calculatedPages.map(i => (
                    <PageItem
                        key={i}
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
                        // eslint-disable-next-line react/no-array-index-key
                        <PageItem key={i} onClick={() => onPageSelected(i + 1)}>
                            {i + 1}
                        </PageItem>
                    ))}
                    <PageItem onClick={() => onPageSelected(currentPage)} isActive>
                        {currentPage}
                    </PageItem>
                </>
            )}
            <Actions isActive={showNext}>
                <PageItem onClick={() => onPageSelected(currentPage + 1)}>›</PageItem>
                {totalPages && <PageItem onClick={() => onPageSelected(totalPages)}>»</PageItem>}
            </Actions>
        </Wrapper>
    );
};

export default Pagination;
