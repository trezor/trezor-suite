import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { State as ReducerState } from '@wallet-reducers/sendFormReducer';
import { FormattedMessage } from 'react-intl';
import { DispatchProps } from '../../Container';
import messages from './index.messages';
import { Account } from '@wallet-types';

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
    amount: ReducerState['amount'];
    address: ReducerState['address'];
    symbol: Account['symbol'];
}

const isDisabled = (
    errors: ReducerState['errors'],
    amount: ReducerState['amount'],
    address: ReducerState['address'],
) => {
    return errors.address !== null || errors.amount !== null || !amount || !address;
};

const SendAndClear = (props: Props) => (
    <Wrapper>
        <Clear isWhite onClick={() => props.sendFormActions.clear()}>
            <FormattedMessage {...messages.TR_CLEAR} />
        </Clear>
        <Send
            isDisabled={isDisabled(props.errors, props.address, props.amount)}
            onClick={() => props.sendFormActions.send()}
        >
            {isDisabled(props.errors, props.address, props.amount)
                ? 'Cannot send please fill the mandatory fields'
                : `Send ${props.amount || ''} ${props.symbol.toUpperCase()}`}
        </Send>
    </Wrapper>
);

export default SendAndClear;
