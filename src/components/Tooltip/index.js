import React, { Component } from 'react';
import RcTooltip from 'rc-tooltip';
import colors from 'config/colors';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { FONT_SIZE } from 'config/variables';

const TooltipContent = styled.div`
    width: ${props => (props.isAside ? '260px' : '320px')};
    font-size: ${FONT_SIZE.SMALLEST};
`;

const Wrapper = styled.div`
    .rc-tooltip {
        position: absolute;
        z-index: 1070;
        display: block;
        background: red;
        visibility: visible;
        border: 1px solid ${colors.DIVIDER};
        border-radius: 3px;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
    }

    .rc-tooltip-hidden {
        display: none;
    }

    .rc-tooltip-inner {
        padding: 8px 10px;
        color: ${colors.TEXT_SECONDARY};
        font-size: 12px;
        line-height: 1.5;
        text-align: left;
        text-decoration: none;
        background-color: ${colors.WHITE};
        border-radius: 3px;
        min-height: 34px;
        border: 1px solid ${colors.WHITE};
    }

    .rc-tooltip-arrow,
    .rc-tooltip-arrow-inner {
        position: absolute;
        width: 0;
        height: 0;
        border-color: transparent;
        border-style: solid;
    }

    .rc-tooltip-placement-top .rc-tooltip-arrow,
    .rc-tooltip-placement-topLeft .rc-tooltip-arrow,
    .rc-tooltip-placement-topRight .rc-tooltip-arrow {
        bottom: -6px;
        margin-left: -6px;
        border-width: 6px 6px 0;
        border-top-color: ${colors.DIVIDER};
    }

    .rc-tooltip-placement-top .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-topLeft .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-topRight .rc-tooltip-arrow-inner {
        bottom: 2px;
        margin-left: -6px;
        border-width: 6px 6px 0;
        border-top-color: ${colors.WHITE};
    }

    .rc-tooltip-placement-top .rc-tooltip-arrow {
        left: 50%;
    }

    .rc-tooltip-placement-topLeft .rc-tooltip-arrow {
        left: 15%;
    }

    .rc-tooltip-placement-topRight .rc-tooltip-arrow {
        right: 15%;
    }

    .rc-tooltip-placement-right .rc-tooltip-arrow,
    .rc-tooltip-placement-rightTop .rc-tooltip-arrow,
    .rc-tooltip-placement-rightBottom .rc-tooltip-arrow {
        left: -5px;
        margin-top: -6px;
        border-width: 6px 6px 6px 0;
        border-right-color: ${colors.DIVIDER};
    }

    .rc-tooltip-placement-right .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-rightTop .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-rightBottom .rc-tooltip-arrow-inner {
        left: 1px;
        margin-top: -6px;
        border-width: 6px 6px 6px 0;
        border-right-color: ${colors.WHITE};
    }

    .rc-tooltip-placement-right .rc-tooltip-arrow {
        top: 50%;
    }

    .rc-tooltip-placement-rightTop .rc-tooltip-arrow {
        top: 15%;
        margin-top: 0;
    }

    .rc-tooltip-placement-rightBottom .rc-tooltip-arrow {
        bottom: 15%;
    }

    .rc-tooltip-placement-left .rc-tooltip-arrow,
    .rc-tooltip-placement-leftTop .rc-tooltip-arrow,
    .rc-tooltip-placement-leftBottom .rc-tooltip-arrow {
        right: -5px;
        margin-top: -6px;
        border-width: 6px 0 6px 6px;
        border-left-color: ${colors.DIVIDER};
    }

    .rc-tooltip-placement-left .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-leftTop .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-leftBottom .rc-tooltip-arrow-inner {
        right: 1px;
        margin-top: -6px;
        border-width: 6px 0 6px 6px;
        border-left-color: ${colors.WHITE};
    }

    .rc-tooltip-placement-left .rc-tooltip-arrow {
        top: 50%;
    }

    .rc-tooltip-placement-leftTop .rc-tooltip-arrow {
        top: 15%;
        margin-top: 0;
    }

    .rc-tooltip-placement-leftBottom .rc-tooltip-arrow {
        bottom: 15%;
    }

    .rc-tooltip-placement-bottom .rc-tooltip-arrow,
    .rc-tooltip-placement-bottomLeft .rc-tooltip-arrow,
    .rc-tooltip-placement-bottomRight .rc-tooltip-arrow {
        top: -5px;
        margin-left: -6px;
        border-width: 0 6px 6px;
        border-bottom-color: ${colors.DIVIDER};
    }

    .rc-tooltip-placement-bottom .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-bottomLeft .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-bottomRight .rc-tooltip-arrow-inner {
        top: 1px;
        margin-left: -6px;
        border-width: 0 6px 6px;
        border-bottom-color: ${colors.WHITE};
    }

    .rc-tooltip-placement-bottom .rc-tooltip-arrow {
        left: 50%;
    }

    .rc-tooltip-placement-bottomLeft .rc-tooltip-arrow {
        left: 15%;
    }

    .rc-tooltip-placement-bottomRight .rc-tooltip-arrow {
        right: 15%;
    }
`;

class Tooltip extends Component {
    constructor(props) {
        super(props);
        this.tooltipContainerRef = React.createRef();
    }

    render() {
        const { placement, content, children } = this.props;
        return (
            <Wrapper innerRef={this.tooltipContainerRef}>
                <RcTooltip
                    getTooltipContainer={() => this.tooltipContainerRef.current}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                    placement={placement}
                    overlay={<TooltipContent>{content}</TooltipContent>}
                >
                    {children}
                </RcTooltip>
            </Wrapper>
        );
    }
}

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
