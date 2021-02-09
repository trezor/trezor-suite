import React from 'react';
import { FormattedDate as IntlFormattedDate } from 'react-intl';
import styled from 'styled-components';

const Bullet = styled.span`
    margin-left: 0.5ch;
    margin-right: 0.5ch;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
`;

const HourWrapper = styled.div<Pick<BulletProps, 'timeLightColor'>>`
    display: inline-flex;
    color: ${props => (props.timeLightColor ? props.theme.TYPE_LIGHT_GREY : 'inherit')};
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
    month: 'short',
    day: '2-digit',
};

const defaultTimeFormat = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
};

const FormattedDate = (props: Props) => {
    return (
        <IntlFormattedDate
            {...(props.date ? defaultDateFormat : {})}
            {...(props.time ? defaultTimeFormat : {})}
            {...props}
        />
    );
};

interface BulletProps extends Pick<Props, 'value'> {
    timeLightColor?: boolean;
    className?: string;
}

export const FormattedDateWithBullet = ({ className, ...props }: BulletProps) => {
    return (
        <Timestamp className={className}>
            <FormattedDate date {...props} />
            <Bullet>&bull;</Bullet>
            <HourWrapper timeLightColor={props.timeLightColor}>
                <FormattedDate time {...props} />
            </HourWrapper>
        </Timestamp>
    );
};

export default FormattedDate;
