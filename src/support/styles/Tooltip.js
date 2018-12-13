import { css } from 'styled-components';
import colors from 'config/colors';
import { FONT_SIZE, LINE_HEIGHT } from 'config/variables';

const tooltipStyles = css`
    .rc-tooltip {
        position: absolute;
        z-index: 10070;
        visibility: visible;
        border: none;
        border-radius: 3px;
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
    }

    .rc-tooltip-hidden {
        display: none;
    }

    .rc-tooltip-inner {
        padding: 8px 10px;
        color: ${colors.WHITE};
        font-size: ${FONT_SIZE.SMALL};
        line-height: ${LINE_HEIGHT.SMALL};
        text-align: left;
        text-decoration: none;
        background-color: ${colors.TOOLTIP_BACKGROUND};
        border-radius: 3px;
        min-height: 34px;
        border: none;
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

export default tooltipStyles;
