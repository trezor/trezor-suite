import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import DatePicker from 'react-datepicker';
import colors from '../../config/colors';
import { style as timerangeGlobalStyles } from './index.style';

const StyledTimerange = styled.div`
    width: 345px;
    display: flex;
    flex-direction: column;
    background: ${colors.NEUE_BG_WHITE};
    border-radius: 4px;
`;
const Inputs = styled.div`
    display: flex;
    width: 100%;
    padding: 10px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};

    & .react-datepicker-popper {
        display: none;
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
    padding: 10px;
`;

interface Props {
    onChange: (startDate: Date, endDate: Date) => any;
    startDate?: Date;
    endDate?: Date;
}

const Timerange = (props: Props) => {
    const today = new Date();
    const [startDate, setStartDate] = useState(props.startDate || null);
    const [endDate, setEndDate] = useState(props.endDate || null);
    const onChangeDate = (dates: any) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
        props.onChange(start, end);
    };
    const onChangeStartDate = (date: Date) => {
        setStartDate(date);
        if (startDate && endDate) {
            props.onChange(startDate, endDate);
        }
    };
    const onChangeEndDate = (date: Date) => {
        setEndDate(date);
        if (startDate && endDate) {
            props.onChange(startDate, endDate);
        }
    };

    useEffect(() => {
        if (props.startDate) {
            setStartDate(props.startDate);
        }
    }, [props.startDate]);

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
                        onChange={(date: Date) => onChangeStartDate(date)}
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
                        onChange={(date: Date) => onChangeEndDate(date)}
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
        </StyledTimerange>
    );
};

export { Timerange, Props as TimerangeProps, timerangeGlobalStyles };
