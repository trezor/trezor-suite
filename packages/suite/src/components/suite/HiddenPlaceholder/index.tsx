import React from 'react';
import styled, { css } from 'styled-components';
import { useSelector } from '@suite-hooks';

interface WrapperProps {
    intensity: number;
    discreetMode: boolean;
}

const Wrapper = styled.span<WrapperProps>`
    ${(props: WrapperProps) =>
        props.discreetMode &&
        css`
            transition: all 0.1s ease;
            filter: blur(${(props: WrapperProps) => props.intensity}px);

            &:hover {
                filter: none;
            }
        `}
`;

interface Props {
    intensity?: number;
    className?: string;
}

export const HiddenPlaceholder: React.FC<Props> = ({ children, intensity = 5, className }) => {
    const discreetMode = useSelector(state => state.wallet.settings.discreetMode);
    return (
        <Wrapper discreetMode={discreetMode} intensity={intensity} className={className}>
            {children}
        </Wrapper>
    );
};
