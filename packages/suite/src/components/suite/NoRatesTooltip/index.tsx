import React from 'react';
import { Translation } from '@suite-components/Translation';
import styled from 'styled-components';
import { Icon, Tooltip, colors } from '@trezor/components';
import messages from '@suite/support/messages';

const StyledIcon = styled(Icon)`
    cursor: pointer;
    align-items: center;
    margin-top: -5px;
`;

const NoRatesTooltip = (props: Partial<typeof Tooltip>) => (
    <Tooltip
        maxWidth={285}
        placement="top"
        content={<Translation {...messages.TR_FIAT_RATES_ARE_NOT_CURRENTLY} />}
        {...props}
    >
        <StyledIcon icon="QUESTION" color={colors.BLACK50} size={12} />
    </Tooltip>
);

export default NoRatesTooltip;
