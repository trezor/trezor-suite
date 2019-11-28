import React from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';

import { variables, Icon, colors } from '@trezor/components';
import { Button } from '@trezor/components-v2';
import messages from '../../index.messages';
import { DispatchProps } from '../../../../Container';

const SetMaxButton = styled(Button)`
    font-size: ${variables.FONT_SIZE.SMALL};
    transition: all 0s;
    border-radius: 0;
    height: 40px;
    display: flex;
    padding: 0;
    min-width: 85px;
`;

const StyledIcon = styled(Icon)`
    padding: 0 5px 0 0;
`;

interface Props {
    canSetMax: boolean;
    outputId: number;
    sendFormActions: DispatchProps['sendFormActions'];
}

const SetMax = (props: Props) => (
    <SetMaxButton
        key="icon"
        onClick={() => {
            props.sendFormActions.setMax(props.outputId);
        }}
        variant="secondary"
        inlineWidth
    >
        <StyledIcon icon="TOP" size={14} color={colors.TEXT_SECONDARY} />
        {/* {!props.canSetMax && <StyledIcon icon="SUCCESS" size={14} color={colors.WHITE} />} */}
        <Translation {...messages.TR_SET_MAX} />
    </SetMaxButton>
);

export default SetMax;
