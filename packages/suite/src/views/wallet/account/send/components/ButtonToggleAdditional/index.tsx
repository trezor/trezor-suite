import React from 'react';
import { variables, colors, Icon } from '@trezor/components';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { DispatchProps } from '../../Container';

const Wrapper = styled.div`
    display: flex;
    cursor: pointer;
    min-height: 41px;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.BASE};
    color: ${colors.TEXT_PRIMARY};
`;

const ToggleIcon = styled(Icon)`
    margin-left: 10px;
    margin-right: 6px;
`;

interface Props {
    isActive: boolean;
    sendFormActions: DispatchProps['sendFormActions'];
}

const ToggleAdditionalButton = (props: Props) => (
    <Wrapper onClick={() => props.sendFormActions.toggleAdditionalFormVisibility()}>
        <Translation {...messages.TR_ADVANCED_SETTINGS} />
        <ToggleIcon
            icon="ARROW_DOWN"
            color={colors.TEXT_SECONDARY}
            size={12}
            isActive={props.isActive}
            canAnimate={props.isActive}
        />
    </Wrapper>
);

export default ToggleAdditionalButton;
