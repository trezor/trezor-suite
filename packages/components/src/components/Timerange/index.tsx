import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import DatePicker from 'react-datepicker';
import { startOfDay, endOfDay } from 'date-fns';
import { Button } from '../buttons/Button';
import { style as datepickerStyle } from './index.style';

const StyledTimerange = styled.div`
    ${datepickerStyle}
    width: 345px;
    display: flex;
    flex-direction: column;
    background: ${props => props.theme.BG_WHITE};
    border-radius: 4px;
`;
const Inputs = styled.div`
    display: flex;
    width: 100%;
    padding: 10px;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};

    & .react-datepicker-popper {
        display: none;
    }
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
const Separator = styled.div`
    width: 20%;
    display: flex;
    align-items: center;
    align-content: center;
    justify-content: center;
`;
const Input = styled.div`
    width: 40%;
`;
const Calendar = styled.div`
    width: 345px;
    padding: 10px 10px 0;
    border-bottom: 1px solid ${props => props.theme.STROKE_GREY};
`;

interface Props {
    onSubmit: (startDate: Date, endDate: Date) => any;
    onCancel: () => any;
    startDate?: Date;
    endDate?: Date;
    ctaCancel: React.ReactNode | string;
    ctaSubmit: React.ReactNode | string;
}

const Timerange = (props: Props) => {
    const today = new Date();
    const [startDate, setStartDate] = useState(props.startDate || null);
    const [endDate, setEndDate] = useState(props.endDate || null);
    const onChangeDate = (dates: [Date, Date]) => {
        const start = dates[0] && startOfDay(dates[0]);
        const end = dates[1] && endOfDay(dates[1]);
        setStartDate(start);
        setEndDate(end);
    };
    const onSubmit = () => {
        if (startDate && endDate) {
            props.onSubmit(startDate, endDate);
        }
    };
    const onCancel = () => {
        props.onCancel();
    };

    useEffect(() => {
        if (props.endDate) {
            setEndDate(props.endDate);
        }
    }, [props.endDate]);

    return (
        <StyledTimerange>
            <Inputs>
                <Input>
                    <DatePicker
                        selected={startDate}
                        onChange={(date: Date) => date && setStartDate(startOfDay(date))}
                        selectsStart
                        startDate={startDate}
                        endDate={endDate}
                        maxDate={endDate || today}
                    />
                </Input>
                <Separator>-</Separator>
                <Input>
                    <DatePicker
                        selected={endDate}
                        onChange={(date: Date) => date && setEndDate(endOfDay(date))}
                        selectsEnd
                        startDate={startDate}
                        endDate={endDate}
                        minDate={startDate}
                        maxDate={today}
                    />
                </Input>
            </Inputs>
            <Calendar>
                <DatePicker
                    selected={startDate}
                    onChange={onChangeDate}
                    startDate={startDate}
                    endDate={endDate}
                    selectsRange
                    inline
                    maxDate={today}
                />
            </Calendar>
            <Buttons>
                <Button variant="secondary" onClick={onCancel} fullWidth>
                    {props.ctaCancel}
                </Button>
                <Button
                    variant="primary"
                    isDisabled={!(startDate && endDate)}
                    onClick={onSubmit}
                    fullWidth
                >
                    {props.ctaSubmit}
                </Button>
            </Buttons>
        </StyledTimerange>
    );
};

export { Timerange, Props as TimerangeProps };
