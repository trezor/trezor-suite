import styled from 'styled-components';
import React, { FocusEvent, MouseEvent, ReactNode } from 'react';
import PropTypes from 'prop-types';

import { variables } from '@trezor/components';

const Wrapper = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: ${variables.TRANSITION.HOVER};
`;

interface Props {
    children: ReactNode;
    onMouseEnter: { (event: MouseEvent<HTMLDivElement>): void };
    onClick: { (event: MouseEvent<HTMLDivElement>): void };
    onMouseLeave: { (event: MouseEvent<HTMLDivElement>): void };
    onFocus: { (event: FocusEvent<HTMLDivElement>): void };
}

const Row = ({ children, onClick, onMouseEnter, onMouseLeave, onFocus }: Props) => (
    <Wrapper
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onFocus={onFocus}
    >
        {children}
    </Wrapper>
);

Row.propTypes = {
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    onClick: PropTypes.func,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
    onFocus: PropTypes.func,
};

export default Row;
