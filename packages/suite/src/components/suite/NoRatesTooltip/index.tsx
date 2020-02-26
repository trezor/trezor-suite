import React from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { Icon, Tooltip, colors, P, variables } from '@trezor/components';
import messages from '@suite/support/messages';

const StyledIcon = styled(Icon)`
    cursor: pointer;
    align-items: center;
`;

const NoRatesMessage = styled.div`
    display: flex;
    align-items: center;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.TINY};
`;

interface Props extends Partial<typeof Tooltip> {
    customText?: React.ReactNode;
    className?: string;
}

const NoRatesTooltip = ({ customText, className, ...props }: Props) => (
    <Tooltip
        maxWidth={285}
        placement="top"
        content={<Translation {...messages.TR_FIAT_RATES_ARE_NOT_CURRENTLY} />}
        {...props}
    >
        <NoRatesMessage className={className}>
            {customText ? <>{customText}</> : 'No data available'}
            <StyledIcon
                icon="QUESTION"
                color={colors.BLACK50}
                hoverColor={colors.BLACK25}
                size={14}
            />
        </NoRatesMessage>
    </Tooltip>
);

export default NoRatesTooltip;
