import React from 'react';
import styled, { css } from 'styled-components';
import { Icon } from '../../Icon';
import { Loader } from '../Loader';

const LoadingWrapper = styled.div`
    display: flex;
    align-items: center;
`;

export type LoadingContentProps = {
    isLoading?: boolean;
    size?: number;
};

const LoaderCell = styled.div<Required<LoadingContentProps>>`
    width: ${({ size }) => 1.5 * size}px;
    transition: all 0.25s ease-out 0.5s;
    svg {
        fill: ${({ theme }) => theme.TYPE_GREEN};
    }
    ${({ isLoading }) =>
        !isLoading &&
        css`
            width: 0;
            opacity: 0;
        `}
`;

export const LoadingContent: React.FC<LoadingContentProps> = ({
    children,
    isLoading = false,
    size = 20,
}) => (
    <LoadingWrapper>
        <LoaderCell isLoading={isLoading} size={size}>
            {isLoading ? <Loader size={size} /> : <Icon icon="CHECK" size={size} />}
        </LoaderCell>
        {children}
    </LoadingWrapper>
);
