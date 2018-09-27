import React, { Component } from 'react';
import RcTooltip from 'rc-tooltip';
import colors from 'config/colors';
import Link from 'components/Link';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const Wrapper = styled.div`
    .rc-tooltip {
        max-width: ${props => `${props.maxWidth}px` || 'auto'};
        position: absolute;
        z-index: 1070;
        display: block;
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
        color: ${colors.WHITE};
        font-size: 12px;
        line-height: 1.5;
        text-align: left;
        text-decoration: none;
        background-color: ${colors.TOOLTIP_BACKGROUND};
        border-radius: 3px;
        min-height: 34px;
        border: 1px solid ${colors.BLACK};
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
        border-top-color: ${colors.BLACK};
    }

    .rc-tooltip-placement-top .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-topLeft .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-topRight .rc-tooltip-arrow-inner {
        bottom: 2px;
        margin-left: -6px;
        border-width: 6px 6px 0;
        border-top-color: ${colors.TOOLTIP_BACKGROUND};
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
        border-right-color: ${colors.TOOLTIP_BACKGROUND};
    }

    .rc-tooltip-placement-right .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-rightTop .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-rightBottom .rc-tooltip-arrow-inner {
        left: 1px;
        margin-top: -6px;
        border-width: 6px 6px 6px 0;
        border-right-color: ${colors.TOOLTIP_BACKGROUND};
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
        border-left-color: ${colors.TOOLTIP_BACKGROUND};
    }

    .rc-tooltip-placement-left .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-leftTop .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-leftBottom .rc-tooltip-arrow-inner {
        right: 1px;
        margin-top: -6px;
        border-width: 6px 0 6px 6px;
        border-left-color: ${colors.TOOLTIP_BACKGROUND};
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
        border-bottom-color: ${colors.TOOLTIP_BACKGROUND};
    }

    .rc-tooltip-placement-bottom .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-bottomLeft .rc-tooltip-arrow-inner,
    .rc-tooltip-placement-bottomRight .rc-tooltip-arrow-inner {
        top: 1px;
        margin-left: -6px;
        border-width: 0 6px 6px;
        border-bottom-color: ${colors.TOOLTIP_BACKGROUND};
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

const Content = styled.div`
    padding-bottom: 10px;
    text-align: justify;
`;

const ContentWrapper = styled.div``;
const ReadMore = styled.div`
    padding: 10px 0 5px 0;
    text-align: center;
    width: 100%;
    color: ${colors.WHITE};
    border-top: 1px solid ${colors.TEXT_SECONDARY};
`;

class Tooltip extends Component {
    render() {
        const {
            className,
            placement,
            content,
            children,
            readMoreLink,
            maxWidth,
        } = this.props;
        return (
            <Wrapper
                maxWidth={maxWidth}
                className={className}
                innerRef={(node) => { this.tooltipContainerRef = node; }}
            >
                <RcTooltip
                    getTooltipContainer={() => this.tooltipContainerRef}
                    arrowContent={<div className="rc-tooltip-arrow-inner" />}
                    placement={placement}
                    overlay={() => (
                        <ContentWrapper>
                            <Content>{content}</Content>
                            {readMoreLink && (
                                <Link target="_blank" href={readMoreLink}>
                                    <ReadMore>Read more</ReadMore>
                                </Link>
                            )
                            }
                        </ContentWrapper>)}
                >
                    {children}
                </RcTooltip>
            </Wrapper>
        );
    }
}

Tooltip.propTypes = {
    className: PropTypes.string,
    placement: PropTypes.string,
    children: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
    maxWidth: PropTypes.number,
    content: PropTypes.oneOfType([
        PropTypes.element,
        PropTypes.string,
    ]),
    readMoreLink: PropTypes.string,
};

export default Tooltip;
