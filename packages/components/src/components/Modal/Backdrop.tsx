import React from 'react';
import styled from 'styled-components';
import { variables } from '../../config';

const Wrapper = styled.div`
    position: fixed;
    z-index: ${variables.Z_INDEX.MODAL};
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
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
