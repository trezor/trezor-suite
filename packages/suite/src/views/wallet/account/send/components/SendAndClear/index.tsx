import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import messages from './index.messages';
import { FormattedMessage } from 'react-intl';

const Wrapper = styled.div`
    display: flex;
    flex: 1 1;

    button + button {
        margin-left: 5px;
    }
`;

const SendButton = styled(Button)`
    word-break: break-all;
    flex: 1;
`;

const ClearButton = styled(Button)``;

interface Props {
    isDisabled: boolean;
    sendButtonText: string;
    clear: () => void;
    send: () => void;
}

const SendAndClear = (props: Props) => (
    <Wrapper>
        <ClearButton isWhite onClick={() => props.clear()}>
            <FormattedMessage {...messages.TR_CLEAR} />
        </ClearButton>
        <SendButton isDisabled={props.isDisabled} onClick={() => props.send()}>
            {props.sendButtonText}
        </SendButton>
    </Wrapper>
);

export default SendAndClear;
