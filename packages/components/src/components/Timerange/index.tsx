import React, { useState } from 'react';
import { DateRange } from 'react-date-range';
import styled from 'styled-components';

import type { Locale } from 'date-fns';

import { Button } from '../buttons/Button';
import { style as datepickerStyle } from './index.style';

type Selection = {
    key: string;
    startDate: Date;
    endDate: Date;
};

export type TimerangeSelection = {
    selection: Selection;
};

const StyledTimerange = styled.div`
    width: 345px;
    display: flex;
    flex-direction: column;
    background: ${props => props.theme.BG_WHITE};
    border-radius: 4px;
`;

const Buttons = styled.div`
    display: flex;
    width: 100%;
    padding: 10px;
    justify-content: space-between;
    & > * + * {
        margin-left: 10px;
    }
`;

const Calendar = styled.div`
    width: 345px;
    padding: 10px 10px 0;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};

    ${datepickerStyle}

    .rdrDayNumber span {
        color: ${props => props.theme.TYPE_LIGHT_GREY};
    }

    .rdrDayDisabled .rdrDayNumber span,
    .rdrDayPassive .rdrDayNumber span {
        opacity: 0.5;
        color: ${props => props.theme.TYPE_LIGHT_GREY};
    }

    .rdrCalendarWrapper {
        background: ${props => props.theme.BG_WHITE};
        color: ${props => props.theme.TYPE_LIGHT_GREY};
    }

    .rdrDateDisplayItem {
        border-radius: 2px;
        background-color: ${props => props.theme.BG_WHITE};
        box-shadow: 0 0 0 2px ${props => props.theme.STROKE_GREY};
        border: 1px solid transparent;
    }

    .rdrDateDisplayItem input {
        color: ${props => props.theme.TYPE_DARK_GREY};
    }

    .rdrDateDisplayItem + .rdrDateDisplayItem {
        &:after {
            color: ${props => props.theme.TYPE_LIGHTER_GREY};
        }
    }

    .rdrDateInput .rdrWarning {
        color: ${props => props.theme.TYPE_ORANGE};
    }

    .rdrMonthAndYearPickers select {
        color: ${props => props.theme.TYPE_LIGHT_GREY};
    }

    .rdrMonthAndYearPickers select:hover {
        background-color: ${props => props.theme.BG_GREY_ALT};
    }

    .rdrNextPrevButton:hover {
        background-color: ${props => props.theme.BG_GREY_ALT};
    }

    .rdrPprevButton i {
        border-color: transparent ${props => props.theme.TYPE_LIGHT_GREY} transparent transparent;
    }

    .rdrNextButton i {
        border-color: transparent transparent transparent ${props => props.theme.TYPE_LIGHT_GREY};
    }

    .rdrWeekDay {
        color: ${props => props.theme.TYPE_LIGHT_GREY};
        opacity: 0.7;
    }

    .rdrDay {
        color: ${props => props.theme.TYPE_LIGHT_GREY};
    }

    .rdrDayToday .rdrDayNumber span:after {
        background: ${props => props.theme.TYPE_DARK_GREY};
    }

    .rdrDayToday .rdrStartEdge .rdrDayNumber span:after,
    .rdrDayToday .rdrEndEdge .rdrDayNumber span:after {
        background: ${props => props.theme.BG_WHITE};
    }

    .rdrDayToday:not(.rdrDayPassive) .rdrInRange ~ .rdrDayNumber span:after,
    .rdrDayToday:not(.rdrDayPassive) .rdrStartEdge ~ .rdrDayNumber span:after,
    .rdrDayToday:not(.rdrDayPassive) .rdrEndEdge ~ .rdrDayNumber span:after,
    .rdrDayToday:not(.rdrDayPassive) .rdrSelected ~ .rdrDayNumber span:after {
        background: ${props => props.theme.BG_WHITE};
    }

    .rdrDay:not(.rdrDayPassive) .rdrInRange ~ .rdrDayNumber span,
    .rdrDay:not(.rdrDayPassive) .rdrSelected ~ .rdrDayNumber span {
        color: ${props => props.theme.TYPE_LIGHT_GREY};
    }

    .rdrDay:not(.rdrDayPassive) .rdrStartEdge ~ .rdrDayNumber span,
    .rdrDay:not(.rdrDayPassive) .rdrEndEdge ~ .rdrDayNumber span {
        color: ${props => props.theme.TYPE_WHITE};
    }

    .rdrSelected,
    .rdrInRange,
    .rdrStartEdge,
    .rdrEndEdge {
        background: ${props => props.theme.BG_LIGHT_GREEN};
    }

    /*.rdrCalendarWrapper:not(.rdrDateRangeWrapper) .rdrDayHovered .rdrDayNumber:after {
        border-color: ${props => props.theme.TYPE_DARK_GREY};
    }*/

    .rdrMonthName {
        color: ${props => props.theme.TYPE_DARK_GREY};
    }

    .rdrDateDisplayWrapper {
        background: ${props => props.theme.BG_WHITE};
        border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
    }

    .rdrStartEdge,
    .rdrEndEdge {
        background: ${props => props.theme.BG_GREEN};
        color: ${props => props.theme.TYPE_WHITE};
        box-shadow: ${props => props.theme.BG_GREEN} 0px 0px 0px 2px;
        border-radius: 4px;
        z-index: 1;
    }

    .rdrDayDisabled {
        opacity: 0.5;
        color: ${props => props.theme.TYPE_LIGHT_GREY};
        background: transparent;
    }

    .rdrDayStartPreview,
    .rdrDayInPreview,
    .rdrDayEndPreview {
        border-color: ${props => props.theme.BG_GREEN};
    }
`;

export interface TimerangeProps {
    onSubmit: (startDate: Date, endDate: Date) => any;
    onCancel: () => any;
    startDate?: Date;
    endDate?: Date;
    locale?: Locale;
    ctaCancel: React.ReactNode | string;
    ctaSubmit: React.ReactNode | string;
}

const Timerange = (props: TimerangeProps) => {
    const today = new Date();

    const [state, setState] = useState({
        startDate: props.startDate || undefined,
        endDate: props.endDate || undefined,
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
                <Button variant="secondary" onClick={onCancel} fullWidth>
                    {props.ctaCancel}
                </Button>
                <Button
                    variant="primary"
                    isDisabled={!(state.startDate && state.endDate)}
                    onClick={onSubmit}
                    fullWidth
                >
                    {props.ctaSubmit}
                </Button>
            </Buttons>
        </StyledTimerange>
    );
};

export { Timerange };
