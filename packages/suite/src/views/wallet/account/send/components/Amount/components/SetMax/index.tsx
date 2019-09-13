import React from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';

import { Button, variables, Icon, colors } from '@trezor/components';
import messages from './index.messages';
import { DispatchProps } from '../../../../Container';

const SetMaxButton = styled(Button)`
    padding: 0 10px;
    font-size: ${variables.FONT_SIZE.SMALL};
    transition: all 0s;
    border-radius: 0;
    border-right: 0;
    border-left: 0;
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
        isWhite={!props.canSetMax}
        isDisabled={props.canSetMax}
    >
        {props.canSetMax && <StyledIcon icon="CLOSE" size={14} color={colors.TEXT_SECONDARY} />}
        {!props.canSetMax && <StyledIcon icon="SUCCESS" size={14} color={colors.WHITE} />}
        <FormattedMessage {...messages.TR_SET_MAX} />
    </SetMaxButton>
);

export default SetMax;
