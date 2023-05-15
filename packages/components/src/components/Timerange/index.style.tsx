import { css } from 'styled-components';

import { variables } from '@trezor/components';

export const style = css`
    .rdrCalendarWrapper {
        box-sizing: border-box;
        display: inline-flex;
        flex-direction: column;
        user-select: none;
        font-size: 12px;
        width: 100%;
    }

    .rdrDateDisplay {
        display: flex;
        justify-content: space-between;
        margin: 10px;
    }

    .rdrDateDisplayItem {
        flex: 1 1;
        width: 0;
        text-align: center;
        color: inherit;
    }

    .rdrDateDisplayItem + .rdrDateDisplayItem {
        margin-left: 41px;

        &::after {
            content: '-';
            display: block;
            position: absolute;
            left: -25px;
            top: 7px;
            font-size: 20px;
        }
    }

    .rdrDateDisplayItem input {
        text-align: inherit;
        cursor: pointer;
        height: 2.8em;
        line-height: 3em;
        border: 0;
        background: transparent;
        width: 100%;
        font-size: 14px;
    }

    .rdrDateInput input {
        outline: none;
    }

    .rdrDateDisplayItem input:disabled {
        cursor: default;
    }

    .rdrMonthAndYearWrapper {
        box-sizing: inherit;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 60px;
        padding-top: 10px;
    }

    .rdrMonthAndYearPickers {
        flex: 1 1 auto;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .rdrNextPrevButton {
        box-sizing: inherit;
        cursor: pointer;
        outline: none;
        display: block;
        width: 32px;
        height: 32px;
        margin: 0 10px;
        padding: 0;
        border: 0;
        border-radius: 5px;
        background: none;
    }

    .rdrMonths {
        display: flex;
    }

    .rdrMonthsVertical {
        flex-direction: column;
    }

    .rdrMonthsHorizontal > div > div > div {
        display: flex;
        flex-direction: row;
    }

    .rdrMonth {
        width: 100%;
        padding: 0 0 1em;
    }

    .rdrWeekDays {
        display: flex;
        padding: 0;
    }

    .rdrWeekDay {
        flex-basis: calc(100% / 7);
        box-sizing: inherit;
        text-align: center;
        line-height: 3em;
    }

    .rdrDays {
        display: flex;
        flex-wrap: wrap;
    }

    .rdrInfiniteMonths {
        overflow: auto;
    }

    .rdrDateRangeWrapper {
        user-select: none;
    }

    .rdrDateInput {
        position: relative;
    }

    .rdrDateInput .rdrWarning {
        position: absolute;
        font-size: 1.3em;
        line-height: 1em;
        top: 12px;
        right: 7px;
    }

    .rdrDay {
        box-sizing: inherit;
        width: calc(100% / 7);
        position: relative;
        font: inherit;
        cursor: pointer;
        font-size: 14px;
        background: transparent;
        user-select: none;
        border: 0;
        padding: 0;
        line-height: 3em;
        height: 3em;
        text-align: center;
    }

    .rdrDayNumber {
        outline: 0;
        position: absolute;
        inset: 5px 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: ${variables.Z_INDEX.BASE};
    }

    .rdrSelected,
    .rdrInRange,
    .rdrStartEdge,
    .rdrEndEdge {
        pointer-events: none;
        position: absolute;
        inset: 5px 0;
    }

    .rdrDayStartPreview,
    .rdrDayInPreview,
    .rdrDayEndPreview {
        position: absolute;
        inset: 3px 0;
        pointer-events: none;
        border: 0 solid currentcolor;
    }

    .rdrDayStartPreview {
        border-top-width: 1px;
        border-left-width: 1px;
        border-bottom-width: 1px;
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        left: 1px;
    }

    .rdrDateRangePickerWrapper {
        display: inline-flex;
        user-select: none;
    }

    .rdrStaticRanges {
        display: flex;
        flex-direction: column;
    }

    .rdrStaticRange {
        font-size: inherit;
    }

    .rdrInputRange {
        display: flex;
    }

    .rdrDayDisabled {
        cursor: not-allowed;
    }

    .rdrMonthAndYearPickers select {
        appearance: none;
        border: 0;
        background: transparent;
        padding: 10px;
        border-radius: 4px;
        outline: 0;
        cursor: pointer;
        text-align: center;
    }

    .rdrMonthPicker,
    .rdrYearPicker {
        margin: 0 5px;
        text-align: center;
        text-align-last: center;
        width: 90px;
    }

    .rdrNextPrevButton i {
        display: block;
        width: 0;
        height: 0;
        padding: 0;
        text-align: center;
        border-style: solid;
        margin: auto;
        transform: translate(-3px, 0);
    }

    .rdrPprevButton i {
        border-width: 4px 6px 4px 4px;
        transform: translate(-3px, 0);
    }

    .rdrNextButton i {
        margin: 0 0 0 10px;
        border-width: 4px 4px 4px 6px;
        transform: translate(3px, 0);
    }

    .rdrMonth .rdrWeekDays {
        padding: 0;
    }

    .rdrMonthName {
        text-align: left;
        font-weight: 600;
        padding: 0.833em;
    }

    .rdrMonths.rdrMonthsVertical .rdrMonth:first-child .rdrMonthName {
        display: none;
    }

    .rdrDay:focus {
        outline: 0;
    }

    .rdrSelected {
        left: 2px;
        right: 2px;
        border-radius: 4px;
    }

    .rdrStartEdge {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        left: 2px;
    }

    .rdrDayStartOfMonth .rdrInRange,
    .rdrDayStartOfMonth .rdrEndEdge,
    .rdrDayStartOfWeek .rdrInRange,
    .rdrDayStartOfWeek .rdrEndEdge {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        left: 2px;
    }

    .rdrDayEndOfMonth .rdrInRange,
    .rdrDayEndOfMonth .rdrStartEdge,
    .rdrDayEndOfWeek .rdrInRange,
    .rdrDayEndOfWeek .rdrStartEdge {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
        right: 2px;
    }

    .rdrDayInPreview {
        border-top-width: 1px;
        border-bottom-width: 1px;
    }

    .rdrDayEndPreview {
        border-top-width: 1px;
        border-right-width: 1px;
        border-bottom-width: 1px;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
        right: 0;
    }

    .rdrDayStartOfMonth .rdrDayInPreview,
    .rdrDayStartOfMonth .rdrDayEndPreview,
    .rdrDayStartOfWeek .rdrDayInPreview,
    .rdrDayStartOfWeek .rdrDayEndPreview {
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
        border-left-width: 1px;
        left: 1px;
    }

    .rdrDayEndOfMonth .rdrDayInPreview,
    .rdrDayEndOfMonth .rdrDayStartPreview,
    .rdrDayEndOfWeek .rdrDayInPreview,
    .rdrDayEndOfWeek .rdrDayStartPreview {
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
        border-right-width: 1px;
        right: 0;
    }

    .rdrCalendarWrapper:not(.rdrDateRangeWrapper) .rdrDayHovered .rdrDayNumber::after {
        content: '';
        border: 1px solid currentcolor;
        border-radius: 4px;
        position: absolute;
        inset: -2px 0;
        background: transparent;
    }

    .rdrDayPassive {
        pointer-events: none;
    }

    .rdrDayPassive .rdrInRange,
    .rdrDayPassive .rdrStartEdge,
    .rdrDayPassive .rdrEndEdge,
    .rdrDayPassive .rdrSelected,
    .rdrDayPassive .rdrDayStartPreview,
    .rdrDayPassive .rdrDayInPreview,
    .rdrDayPassive .rdrDayEndPreview {
        display: none;
    }

    .rdrDayDisabled .rdrInRange,
    .rdrDayDisabled .rdrStartEdge,
    .rdrDayDisabled .rdrEndEdge,
    .rdrDayDisabled .rdrSelected,
    .rdrDayDisabled .rdrDayStartPreview,
    .rdrDayDisabled .rdrDayInPreview,
    .rdrDayDisabled .rdrDayEndPreview {
        filter: grayscale(100%) opacity(60%);
    }

    .rdrDayToday .rdrDayNumber span::after {
        content: '';
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translate(-50%, 0);
        width: 18px;
        height: 2px;
        border-radius: 2px;
    }
`;
