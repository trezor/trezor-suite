import { type ReactNode, useEffect, useState } from 'react';

import styled, { css } from 'styled-components';

import { Spinner } from '../Spinner/Spinner';
import type { SpinnerSize } from '../Spinner/Spinner';

const LoadingWrapper = styled.div`
    display: flex;
    align-items: center;
`;

const LoaderCell = styled.div<{ $size: number; $isLoading: boolean }>`
    width: ${({ $size }) => 1.5 * $size}px;
    transition: opacity 0.25s ease-out;

    ${({ $isLoading }) =>
        $isLoading
            ? css`
                  transition-delay: 0s;
              `
            : css`
                  transition-delay: 2.5s;
                  opacity: 0;
              `}

    svg {
        fill: ${({ theme }) => theme.iconPrimaryDefault};
    }
`;

const ContentCell = styled.div<{ $size: number; $isLoading: boolean }>`
    transition: transform 0.25s ease-out;
    transform: translateX(-${({ $size }) => 1.5 * $size}px);

    ${({ $isLoading }) =>
        $isLoading
            ? css`
                  transition-delay: 0s;
                  transform: none;
              `
            : css`
                  transition-delay: 2.5s;
              `}
`;

export type LoadingContentProps = {
    children: ReactNode;
    isLoading?: boolean;
    size?: SpinnerSize;
    isSuccessful?: boolean;
    isLoadingPositionReversed?: boolean;
    /**
     * If true, `children` will slide to the right when loading starts and are initially placed at -{size}px.
     */
    slideContent?: boolean;
};

export const LoadingContent = ({
    children,
    isLoading = false,
    size = 24,
    isSuccessful = true,
    isLoadingPositionReversed = false,
    slideContent = true,
}: LoadingContentProps) => {
    const [isSpinnerVisible, setIsSpinnerVisible] = useState(false);

    // To make sure the start animaton is visible at the beginning
    useEffect(() => {
        if (isLoading) {
            setIsSpinnerVisible(true);
        }
    }, [isLoading]);

    const SpinnerContainer = () => (
        <LoaderCell $isLoading={isLoading} $size={size}>
            {isSpinnerVisible ? (
                <Spinner
                    size={size}
                    isDisabled={true}
                    data-testid="@loading-content/loader"
                    /* eslint-disable-next-line no-nested-ternary */
                    variant={!isLoading ? (isSuccessful ? 'success' : 'error') : 'loading'}
                    hasStartAnimation
                />
            ) : null}
        </LoaderCell>
    );

    return (
        <LoadingWrapper>
            {!isLoadingPositionReversed && <SpinnerContainer />}
            {slideContent ? (
                <ContentCell $isLoading={isLoading} $size={size}>
                    {children}
                </ContentCell>
            ) : (
                children
            )}
            {isLoadingPositionReversed && <SpinnerContainer />}
        </LoadingWrapper>
    );
};
