import React from 'react';
import RcTooltip from 'rc-tooltip';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { FONT_SIZE } from 'config/variables';

const TooltipContent = styled.div`
    width: ${props => (props.isAside ? '260px' : '320px')};
    font-size: ${FONT_SIZE.SMALLEST};
`;

const Tooltip = ({
    content, placement = 'bottomRight', children,
}) => (
    <RcTooltip
        arrowContent={<div className="rc-tooltip-arrow-inner" />}
        placement={placement}
        overlay={<TooltipContent>{content}</TooltipContent>}
    >
        {children}
    </RcTooltip>
);

Tooltip.propTypes = {
    placement: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
    content: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
};

export default Tooltip;
