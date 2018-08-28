import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { FONT_SIZE } from 'config/variables';

const Wrapper = styled.div`
    width: ${props => (props.isAside ? '260px' : '320px')};
    font-size: ${FONT_SIZE.SMALLEST};
`;

const TooltipContent = ({
    children, isAside = false,
}) => (
    <Wrapper
        isAside={isAside}
    >
        {children}
    </Wrapper>
);

TooltipContent.propTypes = {
    children: PropTypes.node,
    isAside: PropTypes.bool,
};

export default TooltipContent;
