import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { State as ReducerState } from '@wallet-reducers/sendFormReducer';
import { FormattedMessage } from 'react-intl';
import messages from './index.messages';

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
    clear: () => void;
    errors: ReducerState['errors'];
    send: () => void;
}

const isDisabled = (errors: ReducerState['errors']) => {
    return errors.address !== null && errors.amount !== null;
};

const SendAndClear = (props: Props) => (
    <Wrapper>
        <ClearButton isWhite onClick={() => props.clear()}>
            <FormattedMessage {...messages.TR_CLEAR} />
        </ClearButton>
        <SendButton isDisabled={isDisabled(props.errors)} onClick={() => props.send()}>
            {isDisabled(props.errors) ? 'cannot send please fill the mandatory fields' : 'send'}
        </SendButton>
    </Wrapper>
);

export default SendAndClear;
