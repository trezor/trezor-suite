import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { State as ReducerState } from '@wallet-reducers/sendFormReducer';
import { FormattedMessage } from 'react-intl';
import { DispatchProps } from '../../Container';
import messages from './index.messages';

const Wrapper = styled.div`
    display: flex;
    flex: 1 1;

    button + button {
        margin-left: 5px;
    }
`;

const Send = styled(Button)`
    word-break: break-all;
    flex: 1;
`;

const Clear = styled(Button)``;

interface Props {
    sendFormActions: DispatchProps['sendFormActions'];
    errors: ReducerState['errors'];
}

const isDisabled = (errors: ReducerState['errors']) => {
    return errors.address !== null || errors.amount !== null;
};

const SendAndClear = (props: Props) => (
    <Wrapper>
        <Clear isWhite onClick={() => props.sendFormActions.clear()}>
            <FormattedMessage {...messages.TR_CLEAR} />
        </Clear>
        <Send isDisabled={isDisabled(props.errors)} onClick={() => props.sendFormActions.send()}>
            {isDisabled(props.errors) ? 'cannot send please fill the mandatory fields' : 'send'}
        </Send>
    </Wrapper>
);

export default SendAndClear;
