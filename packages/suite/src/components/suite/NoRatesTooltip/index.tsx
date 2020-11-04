import React from 'react';
import { Translation } from '@suite-components';
import styled from 'styled-components';
import { Icon, Tooltip, colors, variables } from '@trezor/components';

const NoRatesMessage = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
    font-weight: ${variables.FONT_WEIGHT.REGULAR};
    text-transform: none;
`;

interface Props extends Partial<typeof Tooltip> {
    customText?: React.ComponentProps<typeof Translation>['id'];
    customTooltip?: React.ComponentProps<typeof Translation>['id'];
    iconOnly?: boolean;
    className?: string;
}

const NoRatesTooltip = ({ customText, iconOnly, customTooltip, className, ...props }: Props) => (
    <NoRatesMessage className={className}>
        {!iconOnly && <Translation id={customText || 'TR_FIAT_RATES_NOT_AVAILABLE'} />}
        <Tooltip
            maxWidth={285}
            placement="top"
            content={<Translation id={customTooltip || 'TR_FIAT_RATES_NOT_AVAILABLE_TOOLTIP'} />}
            {...props}
        >
            <Icon
                icon="QUESTION"
                color={colors.BLACK50}
                hoverColor={colors.BLACK25}
                size={14}
                useCursorPointer
            />
        </Tooltip>
    </NoRatesMessage>
);

export default NoRatesTooltip;
