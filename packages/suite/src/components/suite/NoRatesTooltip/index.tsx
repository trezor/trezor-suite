import React from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { Icon, Tooltip, colors } from '@trezor/components-v2';
import messages from '@suite/support/messages';

const StyledIcon = styled(Icon)`
    cursor: pointer;
    align-items: center;
`;

interface Props extends Partial<typeof Tooltip> {
    children?: React.ReactNode;
}

const NoRatesTooltip = ({ children, ...props }: Props) => (
    <Tooltip
        maxWidth={285}
        placement="top"
        content={<Translation {...messages.TR_FIAT_RATES_ARE_NOT_CURRENTLY} />}
        {...props}
    >
        <>
            {children}
            <StyledIcon
                icon="QUESTION"
                color={colors.BLACK50}
                hoverColor={colors.BLACK25}
                size={14}
            />
        </>
    </Tooltip>
);

export default NoRatesTooltip;
