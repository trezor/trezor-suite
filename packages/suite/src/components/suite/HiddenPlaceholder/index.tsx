import React, { ReactNode } from 'react';
import { useHover } from '@suite-utils/dom';
import styled from 'styled-components';

const Wrapper = styled.span``;

interface BlurProps {
    intensity: number;
}

const Blurred = styled.div<BlurProps>`
    filter: blur(${props => props.intensity || 4}px);
`;

interface Props {
    showOnHover: boolean;
    children: ReactNode;
    discreetMode: boolean;
    intensity: number;
}

export default ({ showOnHover = true, children, discreetMode, intensity }: Props) => {
    const [hoverRef, isHovered] = useHover();

    if (!discreetMode) return children;

    return (
        // @ts-ignore
        <Wrapper ref={hoverRef}>
            {isHovered && children}
            {!isHovered && showOnHover && <Blurred intensity={intensity}>{children}</Blurred>}
        </Wrapper>
    );
};
