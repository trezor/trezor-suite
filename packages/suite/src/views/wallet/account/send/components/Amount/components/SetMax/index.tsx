import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { Button, variables, Icon, colors } from '@trezor/components';
import messages from './index.messages';
import { DispatchProps } from '../../../../Container';

const SetMaxButton = styled(Button)`
    font-size: ${variables.FONT_SIZE.SMALL};
    transition: all 0s;
    border-radius: 0;
    height: 40px;
    border-right: 0;
    display: flex;
    border-left: 0;
    padding: 0;
    min-width: 85px;
`;

const StyledIcon = styled(Icon)`
    padding: 0 5px 0 0;
`;

interface Props {
    canSetMax: boolean;
    sendFormActions: DispatchProps['sendFormActions'];
}

const SetMax = (props: Props) => (
    <SetMaxButton
        key="icon"
        onClick={() => props.sendFormActions.setMax()}
        isWhite={props.canSetMax}
    >
        {props.canSetMax && <StyledIcon icon="TOP" size={14} color={colors.TEXT_SECONDARY} />}
        {!props.canSetMax && <StyledIcon icon="SUCCESS" size={14} color={colors.WHITE} />}
        <FormattedMessage {...messages.TR_SET_MAX} />
    </SetMaxButton>
);

export default SetMax;
