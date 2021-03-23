import React from 'react';
import { Translation } from '@suite-components';
import styled from 'styled-components';
import { Icon, Tooltip, useTheme, variables } from '@trezor/components';

const NoRatesMessage = styled.div`
    display: flex;
    align-items: center;
    color: ${props => props.theme.TYPE_LIGHT_GREY};
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

const NoRatesTooltip = ({ customText, iconOnly, customTooltip, className, ...props }: Props) => {
    const theme = useTheme();

    return (
        <NoRatesMessage className={className}>
            {!iconOnly && <Translation id={customText || 'TR_FIAT_RATES_NOT_AVAILABLE'} />}
            <Tooltip
                maxWidth={285}
                content={
                    <Translation id={customTooltip || 'TR_FIAT_RATES_NOT_AVAILABLE_TOOLTIP'} />
                }
                {...props}
            >
                <Icon
                    icon="QUESTION"
                    color={theme.TYPE_LIGHT_GREY}
                    hoverColor={theme.TYPE_DARK_GREY}
                    size={14}
                    useCursorPointer
                />
            </Tooltip>
        </NoRatesMessage>
    );
};

export default NoRatesTooltip;
