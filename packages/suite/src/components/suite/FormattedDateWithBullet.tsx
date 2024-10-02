import styled from 'styled-components';

import { FormattedDate, FormattedDateProps } from './FormattedDate';

const Bullet = styled.span`
    margin-left: 0.5ch;
    margin-right: 0.5ch;
`;

const HourWrapper = styled.div<{ $timeLightColor?: boolean }>`
    display: inline-flex;
`;

const Timestamp = styled.span`
    white-space: nowrap;
`;

interface BulletProps extends Pick<FormattedDateProps, 'value'> {
    timeLightColor?: boolean;
    className?: string;
}

export const FormattedDateWithBullet = ({ className, ...props }: BulletProps) => (
    <Timestamp className={className}>
        <FormattedDate date {...props} />
        <Bullet>&bull;</Bullet>
        <HourWrapper $timeLightColor={props.timeLightColor}>
            <FormattedDate time {...props} />
        </HourWrapper>
    </Timestamp>
);
