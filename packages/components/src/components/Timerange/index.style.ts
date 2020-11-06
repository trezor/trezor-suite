import colors from '../../config/colors';
import { style as reactDatepickerStyle } from './react-datepicker.style';

export const style = `
    ${reactDatepickerStyle}

    .react-datepicker {
        font-weight: 500;
        border: 0;
    }
    .react-datepicker__header {
        background-color: ${colors.NEUE_BG_WHITE};
        border: 0;
        padding: 10px 0 0;
        border-top-left-radius: 0;
    }
    .react-datepicker__current-month {
        padding-bottom: 22px;
        font-size: 14px;
        font-weight: 500;
        color: ${colors.NEUE_TYPE_DARK_GREY};
    }
    .react-datepicker__week {
        padding: 2px 0;
    }
    .react-datepicker__day {
        color: ${colors.NEUE_TYPE_LIGHT_GREY};
        font-size: 14px;
        width: 45px;
        line-height: 2.5;
        padding: 3px 0 1px;
    }
    .react-datepicker__day--disabled {
        opacity: 0.5;
    }
    .react-datepicker__day-name {
        text-transform: uppercase;
        color: ${colors.NEUE_TYPE_LIGHT_GREY};
        opacity: 0.5;
        line-height: 1.3;
        width: 45px;
    }
    .react-datepicker__day--keyboard-selected {
        background: transparent;
    }
    .react-datepicker__day--today,
    .react-datepicker__month-text--today,
    .react-datepicker__quarter-text--today,
    .react-datepicker__year-text--today {
        font-weight: 500;
    }
    .react-datepicker__navigation {
        top: 12px;
        overflow: visible;
        transform: scale(0.7);
        border: 7px solid transparent;
    }
    .react-datepicker__navigation:after {
        content: '';
        background: none;
        line-height: 1.7;
        text-align: center;
        cursor: pointer;
        position: absolute;
        top: -5px;
        padding: 0;
        border: 5px solid transparent;
        z-index: 1;
        height: 10px;
        width: 10px;
        text-indent: -999em;
        overflow: hidden;
    }
    .react-datepicker__navigation--previous {
        left: 50px;
        border-right-color: ${colors.NEUE_TYPE_LIGHT_GREY};
    }
    .react-datepicker__navigation--previous:after {
        left: -2px;
        border-right-color: ${colors.NEUE_BG_WHITE};
    }
    .react-datepicker__navigation--next {
        right: 50px;
        border-left-color: ${colors.NEUE_TYPE_LIGHT_GREY};
    }
    .react-datepicker__navigation--next:after {
        right: -2px;
        border-left-color: ${colors.NEUE_BG_WHITE};
    }
    .react-datepicker__day--outside-month {
        opacity: 0.5;
    }
    .react-datepicker__header:not(.react-datepicker__header--has-time-select) {
        border-top-right-radius: 0;
    }
    .react-datepicker__day--selected,
    .react-datepicker__day--in-range,
    .react-datepicker__day--in-selecting-range {
        background: ${colors.NEUE_BG_LIGHT_GREEN};
        color: ${colors.NEUE_TYPE_LIGHT_GREY};
        border-radius: 0;
        position: relative;
    }
    .react-datepicker__day--today {
        background: ${colors.NEUE_BG_GRAY};
    }
    .react-datepicker__day--in-range {
        border-radius: 0;
    }
    .react-datepicker__day--keyboard-selected:hover,
    .react-datepicker__day--range-start,
    .react-datepicker__day--range-end,
    .react-datepicker__day--in-selecting-range:hover,
    .react-datepicker__day--in-range:hover,
    .react-datepicker__day--selected,
    .react-datepicker__day--selected:hover,
    .react-datepicker__month-text--selected:hover,
    .react-datepicker__quarter-text--selected:hover,
    .react-datepicker__year-text--selected:hover {
        background: ${colors.NEUE_BG_GREEN};
        color: ${colors.WHITE};
        box-shadow: 0 0 0px 1px ${colors.NEUE_BG_GREEN};
        border-radius: 4px;
        z-index: 1;
        position: relative;
    }
    .react-datepicker__day-name,
    .react-datepicker__day,
    .react-datepicker__time-name {
        margin: 0;
    }
    .react-datepicker__month-text--in-selecting-range:hover,
    .react-datepicker__month-text--in-range:hover,
    .react-datepicker__quarter-text--in-selecting-range:hover,
    .react-datepicker__quarter-text--in-range:hover,
    .react-datepicker__year-text--in-selecting-range:hover,
    .react-datepicker__year-text--in-range:hover {
        background: ${colors.NEUE_BG_GREEN};
        color: ${colors.WHITE};
        border-radius: 0px;
    }
    .react-datepicker__input-container input {
        padding: 1px 16px 0 16px;
        color: ${colors.NEUE_TYPE_DARK_GREY};
        border: 2px solid ${colors.NEUE_STROKE_GREY};
        border-radius: 4px;
        font-weight: 500;
        height: 48px;
        font-size: 14px;
        width: 100%;
    }
`;
