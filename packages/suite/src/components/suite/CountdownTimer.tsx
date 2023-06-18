import React from 'react';
import styled from 'styled-components';
import { FormattedNumber } from 'react-intl';
import { Translation } from './Translation';
import { TranslationKey } from '@suite-common/intl-types';
import { useCountdownTimer } from 'src/hooks/suite';

const UnitWrapper = styled.span`
    font-variant-numeric: tabular-nums;
`;

type Unit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

const units: Array<{ format: keyof Duration; unit: Unit }> = [
    { format: 'years', unit: 'year' },
    { format: 'months', unit: 'month' },
    { format: 'weeks', unit: 'week' },
    { format: 'days', unit: 'day' },
    { format: 'hours', unit: 'hour' },
    { format: 'minutes', unit: 'minute' },
    { format: 'seconds', unit: 'second' },
];

interface CountdownTimerProps {
    deadline: number;
    pastDeadlineMessage?: TranslationKey;
    message?: TranslationKey;
    minUnit?: Unit;
    minUnitValue?: number;
    unitDisplay?: 'long' | 'short' | 'narrow';
    isApproximate?: boolean;
    className?: string;
}

export const CountdownTimer = ({
    deadline,
    pastDeadlineMessage,
    message,
    minUnit = 'second',
    minUnitValue = 0,
    unitDisplay = 'short',
    isApproximate,
    className,
}: CountdownTimerProps) => {
    const { duration, isPastDeadline } = useCountdownTimer(deadline);
    const minUnitIndex = units.findIndex(({ unit }) => minUnit === unit);
    const firstValue = units.reduce<number>(
        (value, { format }) => value || duration[format] || 0,
        0,
    );
    const messageId = (isPastDeadline && pastDeadlineMessage) || message;

    const getValue = () => (
        <>
            {!isPastDeadline && isApproximate && `~ `}
            {units.slice(0, minUnitIndex + 1).map(({ format, unit }, index, array) => {
                const keyValue = duration[format] ?? 0;
                const isLast = index + 1 === array.length;
                const value = isLast ? Math.max(keyValue, minUnitValue) : keyValue;

                return (
                    (isLast || value > 0) && (
                        <UnitWrapper key={format}>
                            <FormattedNumber
                                value={value}
                                style="unit"
                                unit={unit}
                                unitDisplay={unitDisplay}
                            />
                            {!isLast && ' '}
                        </UnitWrapper>
                    )
                );
            })}
        </>
    );

    return (
        <span className={className}>
            {messageId ? (
                <Translation
                    id={messageId}
                    values={{
                        value: getValue(),
                        firstValue,
                    }}
                />
            ) : (
                getValue()
            )}
        </span>
    );
};
