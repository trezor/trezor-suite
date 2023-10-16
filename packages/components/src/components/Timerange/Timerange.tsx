import { useState, ReactNode } from 'react';
import { DateRange } from 'react-date-range';
import styled, { css } from 'styled-components';
import { mediaQueries } from '@trezor/styles';

import type { Locale } from 'date-fns';

import { Button } from '../buttons/Button/Button';
import { variables } from '../../config';

type Selection = {
    key: string;
    startDate: Date;
    endDate: Date;
};

export type TimerangeSelection = {
    selection: Selection;
};

/* stylelint-disable no-descending-specificity */
const datepickerStyle = css`
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
        &:after {
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
        border: 0px;
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
        padding: 0 0 1em 0;
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
        left: 0;
        right: 0;
        top: 5px;
        bottom: 5px;
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
        top: 5px;
        left: 0;
        right: 0;
        bottom: 5px;
    }

    .rdrDayStartPreview,
    .rdrDayInPreview,
    .rdrDayEndPreview {
        position: absolute;
        top: 3px;
        left: 0px;
        right: 0px;
        bottom: 3px;
        pointer-events: none;
        border: 0px solid currentColor;
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
        transform: translate(-3px, 0px);
    }

    .rdrPprevButton i {
        border-width: 4px 6px 4px 4px;
        transform: translate(-3px, 0px);
    }

    .rdrNextButton i {
        margin: 0 0 0 10px;
        border-width: 4px 4px 4px 6px;
        transform: translate(3px, 0px);
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
        right: 0px;
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
        right: 0px;
    }

    .rdrCalendarWrapper:not(.rdrDateRangeWrapper) .rdrDayHovered .rdrDayNumber:after {
        content: '';
        border: 1px solid currentColor;
        border-radius: 4px;
        position: absolute;
        top: -2px;
        bottom: -2px;
        left: 0px;
        right: 0px;
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

    .rdrDayToday .rdrDayNumber span:after {
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

const StyledTimerange = styled.div`
    width: 345px;
    display: flex;
    flex-direction: column;
    background: ${({ theme }) => theme.BG_WHITE};
    border-radius: 12px;

    ${mediaQueries.dark_theme} {
        border: 1px solid ${({ theme }) => theme.STROKE_LIGHT_GREY};
    }
`;

const Buttons = styled.div`
    display: flex;
    width: 100%;
    padding: 12px;
    justify-content: space-between;

    & > * + * {
        margin-left: 10px;
    }
`;

const Calendar = styled.div`
    width: 345px;
    padding: 12px 12px 0;
    border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};

    ${datepickerStyle}

    .rdrDayNumber span {
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    }

    .rdrDayDisabled .rdrDayNumber span,
    .rdrDayPassive .rdrDayNumber span {
        opacity: 0.5;
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    }

    .rdrCalendarWrapper {
        background: ${({ theme }) => theme.BG_WHITE};
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    }

    .rdrDateDisplay {
        margin: 0;
    }

    .rdrDateDisplayItem {
        border-radius: 8px;
        background-color: transparent;
        border: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }

    .rdrDateDisplayItem input {
        color: ${({ theme }) => theme.TYPE_DARK_GREY};
    }

    .rdrDateDisplayItem + .rdrDateDisplayItem {
        &:after {
            color: ${({ theme }) => theme.TYPE_LIGHTER_GREY};
        }
    }

    .rdrDateInput .rdrWarning {
        color: ${({ theme }) => theme.TYPE_ORANGE};
    }

    .rdrMonthAndYearPickers select {
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    }

    .rdrMonthAndYearPickers select:hover {
        background-color: ${({ theme }) => theme.BG_GREY_ALT};
    }

    .rdrNextPrevButton {
        width: 26px;
        height: 26px;
        background: ${({ theme }) => theme.BG_LIGHT_GREEN};
        border-radius: 50%;
    }

    .rdrNextPrevButton:hover {
        background: ${({ theme }) => theme.BG_SECONDARY_HOVER};
    }

    .rdrPprevButton i {
        margin: 0 0 0 8px;
        border-color: transparent ${({ theme }) => theme.TYPE_LIGHT_GREY} transparent transparent;
    }

    .rdrNextButton i {
        margin: auto;
        border-color: transparent transparent transparent ${({ theme }) => theme.TYPE_LIGHT_GREY};
    }

    .rdrWeekDay {
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
        opacity: 0.7;
    }

    .rdrDay {
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    }

    .rdrDayToday .rdrDayNumber span:after {
        background: ${({ theme }) => theme.TYPE_DARK_GREY};
    }

    .rdrDayToday .rdrStartEdge .rdrDayNumber span:after,
    .rdrDayToday .rdrEndEdge .rdrDayNumber span:after {
        background: ${({ theme }) => theme.BG_WHITE};
    }

    .rdrDayToday:not(.rdrDayPassive) .rdrInRange ~ .rdrDayNumber span:after,
    .rdrDayToday:not(.rdrDayPassive) .rdrStartEdge ~ .rdrDayNumber span:after,
    .rdrDayToday:not(.rdrDayPassive) .rdrEndEdge ~ .rdrDayNumber span:after,
    .rdrDayToday:not(.rdrDayPassive) .rdrSelected ~ .rdrDayNumber span:after {
        background: ${({ theme }) => theme.BG_WHITE};
    }

    .rdrDay:not(.rdrDayPassive) .rdrInRange ~ .rdrDayNumber span,
    .rdrDay:not(.rdrDayPassive) .rdrSelected ~ .rdrDayNumber span {
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    }

    .rdrDay:not(.rdrDayPassive) .rdrStartEdge ~ .rdrDayNumber span,
    .rdrDay:not(.rdrDayPassive) .rdrEndEdge ~ .rdrDayNumber span {
        color: ${({ theme }) => theme.TYPE_WHITE};
    }

    .rdrSelected,
    .rdrInRange,
    .rdrStartEdge,
    .rdrEndEdge {
        background: ${({ theme }) => theme.BG_LIGHT_GREEN};
    }

    .rdrMonthName {
        color: ${({ theme }) => theme.TYPE_DARK_GREY};
    }

    .rdrDateDisplayWrapper {
        padding-bottom: 13px;
        background: ${({ theme }) => theme.BG_WHITE};
        border-bottom: 1px solid ${({ theme }) => theme.STROKE_GREY};
    }

    .rdrMonthAndYearWrapper {
        height: 50px;
        padding-top: 0;
    }

    .rdrStartEdge,
    .rdrEndEdge {
        background: ${({ theme }) => theme.BG_GREEN};
        color: ${({ theme }) => theme.TYPE_WHITE};
        box-shadow: ${({ theme }) => theme.BG_GREEN} 0px 0px 0px 2px;
        border-radius: 4px;
        z-index: ${variables.Z_INDEX.BASE};
    }

    .rdrDayDisabled {
        opacity: 0.5;
        color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
        background: transparent;
    }

    .rdrDayStartPreview,
    .rdrDayInPreview,
    .rdrDayEndPreview {
        border: none;
        background: ${({ theme }) => theme.BG_LIGHT_GREEN};
    }
`;

export interface TimerangeProps {
    onSubmit: (startDate: Date, endDate: Date) => any;
    onCancel: () => any;
    startDate?: Date;
    endDate?: Date;
    locale?: Locale;
    ctaCancel: ReactNode | string;
    ctaSubmit: ReactNode | string;
}

const Timerange = (props: TimerangeProps) => {
    const today = new Date();

    const [state, setState] = useState({
        startDate: props.startDate || null,
        endDate: props.endDate || new Date(''), // fix for incorrect class names https://github.com/hypeserver/react-date-range/issues/330#issuecomment-802601417
        key: 'selection',
    });

    const onCancel = () => {
        props.onCancel();
    };

    const onSubmit = () => {
        if (state.startDate && state.endDate) {
            props.onSubmit(state.startDate, state.endDate);
        }
    };

    return (
        <StyledTimerange>
            <Calendar>
                <DateRange
                    editableDateInputs
                    onChange={(item: TimerangeSelection) => setState(item.selection)}
                    moveRangeOnFirstSelection={false}
                    maxDate={today}
                    ranges={[state]}
                    startDatePlaceholder=""
                    endDatePlaceholder=""
                    locale={props.locale}
                />
            </Calendar>
            <Buttons>
                <Button variant="secondary" onClick={onCancel} isFullWidth>
                    {props.ctaCancel}
                </Button>
                <Button
                    variant="primary"
                    isDisabled={!(state.startDate && state.endDate)}
                    onClick={onSubmit}
                    isFullWidth
                >
                    {props.ctaSubmit}
                </Button>
            </Buttons>
        </StyledTimerange>
    );
};

export { Timerange };
