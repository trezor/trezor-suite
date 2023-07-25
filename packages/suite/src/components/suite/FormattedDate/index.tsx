import React from 'react';
import { FormattedDate as IntlFormattedDate } from 'react-intl';
import styled from 'styled-components';

const Bullet = styled.span`
    margin-left: 0.5ch;
    margin-right: 0.5ch;
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
`;

const HourWrapper = styled.div<Pick<BulletProps, 'timeLightColor'>>`
    display: inline-flex;
    color: ${({ theme, timeLightColor }) => (timeLightColor ? theme.TYPE_LIGHT_GREY : 'inherit')};
`;

const Timestamp = styled.span`
    white-space: nowrap;
`;

interface Props extends React.ComponentProps<typeof IntlFormattedDate> {
    date?: boolean;
    time?: boolean;
}

const defaultDateFormat = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
} as const;

const defaultTimeFormat = {
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
} as const;

const FormattedDate = (props: Props) => (
    <IntlFormattedDate
        {...(props.date ? defaultDateFormat : {})}
        {...(props.time ? defaultTimeFormat : {})}
        {...props}
    />
);

interface BulletProps extends Pick<Props, 'value'> {
    timeLightColor?: boolean;
    className?: string;
}

export const FormattedDateWithBullet = ({ className, ...props }: BulletProps) => (
    <Timestamp className={className}>
        <FormattedDate date {...props} />
        <Bullet>&bull;</Bullet>
        <HourWrapper timeLightColor={props.timeLightColor}>
            <FormattedDate time {...props} />
        </HourWrapper>
    </Timestamp>
);

export default FormattedDate;
