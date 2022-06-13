import React from 'react';
import styled from 'styled-components';
import { variables } from '../../config';

const Wrapper = styled.div`
    position: absolute;
    z-index: ${variables.Z_INDEX.MODAL};
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;

    /* backdrop-filter does not work in Firefox, use darker background instead */
    backdrop-filter: blur(5px);
    background: rgba(0, 0, 0, 0.3);

    @supports not ((-webkit-backdrop-filter: blur(5px)) or (backdrop-filter: blur(5px))) {
        background: rgba(0, 0, 0, 0.6);
    }

    > :first-child {
        margin-top: auto;
    }
    > :last-child {
        margin-bottom: auto;
    }
`;

export type BackdropProps = {
    onClick?: () => void;
    className?: string;
};

export const Backdrop: React.FC<BackdropProps> = ({ onClick, children, className }) => (
    <Wrapper onClick={onClick} className={className}>
        {children}
    </Wrapper>
);
