import React from 'react';
import { variables, colors, Icon } from '@trezor/components';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { DispatchProps } from '../../Container';

const Wrapper = styled.div`
    display: flex;
    min-height: 41px;
    align-items: center;
    justify-content: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    font-size: ${variables.FONT_SIZE.BODY};
    color: ${colors.BLACK17};
`;

const ToggleIcon = styled(Icon)`
    margin-left: 8px;
`;

const Text = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
`;

interface Props {
    isActive: boolean;
    sendFormActions: DispatchProps['sendFormActions'];
}

export default (props: Props) => (
    <Wrapper>
        <Text onClick={() => props.sendFormActions.toggleAdditionalFormVisibility()}>
            {props.isActive ? (
                <Translation {...messages.TR_HIDE_ADVANCED_OPTIONS} />
            ) : (
                <Translation {...messages.TR_SHOW_ADVANCED_OPTIONS} />
            )}

            <ToggleIcon
                icon="ARROW_DOWN"
                color={colors.BLACK17}
                size={12}
                isActive={props.isActive}
                canAnimate={props.isActive}
            />
        </Text>
    </Wrapper>
);
