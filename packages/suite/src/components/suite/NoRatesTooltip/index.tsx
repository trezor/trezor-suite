import React from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { Icon, Tooltip, colors, variables } from '@trezor/components';

const StyledIcon = styled(Icon)`
    cursor: pointer;
    align-items: center;
`;

const NoRatesMessage = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
    text-transform: none;
`;

interface Props extends Partial<typeof Tooltip> {
    customText?: React.ReactNode;
    iconOnly?: boolean;
    className?: string;
}

const NoRatesTooltip = ({ customText, iconOnly, className, ...props }: Props) => (
    <NoRatesMessage className={className}>
        {!iconOnly && customText && <>{customText}</>}
        {!iconOnly && !customText && 'No data available'}
        <Tooltip
            maxWidth={285}
            placement="top"
            content={<Translation id="TR_FIAT_RATES_ARE_NOT_CURRENTLY" />}
            {...props}
        >
            <StyledIcon
                icon="QUESTION"
                color={colors.BLACK50}
                hoverColor={colors.BLACK25}
                size={14}
            />
        </Tooltip>
    </NoRatesMessage>
);

export default NoRatesTooltip;
