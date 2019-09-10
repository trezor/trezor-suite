import React from 'react';
import { variables, Button, colors, Icon } from '@trezor/components';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import messages from './index.messages';

const Wrapper = styled.div``;

const ToggleButton = styled(Button)`
    min-height: 40px;
    padding: 0;
    display: flex;
    flex: 1 1 0;
    align-items: center;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    justify-content: flex-start;
`;

const ToggleIcon = styled(Icon)`
    margin-left: 10px;
    margin-right: 6px;
`;

interface Props {
    isActive: boolean;
    toggle: () => void;
}

const ToggleAdditionalButton = (props: Props) => (
    <Wrapper>
        <ToggleButton isTransparent onClick={() => props.toggle()}>
            <FormattedMessage {...messages.TR_ADVANCED_SETTINGS} />
            <ToggleIcon
                icon="ARROW_DOWN"
                color={colors.TEXT_SECONDARY}
                size={12}
                isActive={props.isActive}
                canAnimate={props.isActive}
            />
        </ToggleButton>
    </Wrapper>
);

export default ToggleAdditionalButton;
