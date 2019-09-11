import React, { useMemo } from 'react';
import { colors } from '@trezor/components';
import styled from 'styled-components';

const Wrapper = styled.div`
    display: flex;
    justify-content: center;
    margin-top: 10px;
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
`;

interface Props {
    currentPage: number;
    totalPages?: number;
    onPageSelected: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, onPageSelected }: Props) => {
    // if totalPages is undefined show only start/prev/next buttons
    const showNext = totalPages ? currentPage < totalPages : true;
    const showPrevious = currentPage > 1;
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
                    <PageItem key={i} onClick={() => onPageSelected(i)} isActive={i === currentPage}>
                        {i}
                    </PageItem>
                ))
            ) : (
                <PageItem onClick={() => onPageSelected(currentPage)} isActive>
                    {currentPage}
                </PageItem>
            )}
            <Actions isActive={showNext}>
                <PageItem onClick={() => onPageSelected(currentPage + 1)}>›</PageItem>
                {totalPages && <PageItem onClick={() => onPageSelected(totalPages)}>»</PageItem>}
            </Actions>
        </Wrapper>
    );
};

export default Pagination;
