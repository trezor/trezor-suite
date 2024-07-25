import { ReactNode, useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import { Spinner } from '../Spinner/Spinner';

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
                  transition-delay: 0;
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
                  transition-delay: 0;
                  transform: none;
              `
            : css`
                  transition-delay: 2.5s;
              `}
`;

export type LoadingContentProps = {
    children: ReactNode;
    isLoading?: boolean;
    size?: number;
    isSuccessful?: boolean;
};

export const LoadingContent = ({
    children,
    isLoading = false,
    size = 25,
    isSuccessful = true,
}: LoadingContentProps) => {
    const [isSpinnerVisible, setIsSpinnerVisible] = useState(false);

    // To make sure the start animaton is visible at the beginning
    useEffect(() => {
        if (isLoading) {
            setIsSpinnerVisible(true);
        }
    }, [isLoading]);

    return (
        <LoadingWrapper>
            <LoaderCell $isLoading={isLoading} $size={size}>
                {isSpinnerVisible && (
                    <Spinner
                        size={size}
                        dataTest="@loading-content/loader"
                        hasStartAnimation
                        hasFinished={!isLoading && isSuccessful}
                        hasError={!isLoading && !isSuccessful}
                    />
                )}
            </LoaderCell>
            <ContentCell $isLoading={isLoading} $size={size}>
                {children}
            </ContentCell>
        </LoadingWrapper>
    );
};
