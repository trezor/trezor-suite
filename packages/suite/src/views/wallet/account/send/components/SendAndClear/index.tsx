import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { State as ReducerState } from '@wallet-reducers/sendFormReducer';
import { FormattedMessage } from 'react-intl';
import commonMessages from '@wallet-views/messages';
import { DispatchProps } from '../../Container';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    flex: 1;

    justify-content: flex-end;
`;

const Send = styled(Button)`
    min-width: 200px;
    margin-left: 10px;
`;

const Clear = styled(Button)``;

interface Props {
    sendFormActions: DispatchProps['sendFormActions'];
    sendFormActionsBitcoin: DispatchProps['sendFormActionsBitcoin'];
    sendFormActionsEthereum: DispatchProps['sendFormActionsEthereum'];
    sendFormActionsRipple: DispatchProps['sendFormActionsRipple'];
    errors: ReducerState['errors'];
    amount: ReducerState['amount'];
    address: ReducerState['address'];
    networkType: Account['networkType'];
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
        <Clear variant="white" onClick={() => props.sendFormActions.clear()}>
            <FormattedMessage {...commonMessages.TR_CLEAR} />
        </Clear>
        <Send
            isDisabled={isDisabled(props.errors, props.address, props.amount)}
            onClick={() => {
                switch (props.networkType) {
                    case 'bitcoin':
                        props.sendFormActionsBitcoin.send();
                        break;
                    case 'ethereum':
                        props.sendFormActionsEthereum.send();
                        break;
                    case 'ripple':
                        props.sendFormActionsRipple.send();
                        break;
                    // no default
                }
            }}
        >
            {isDisabled(props.errors, props.address, props.amount)
                ? 'Send'
                : `Send ${props.amount || ''} ${props.symbol.toUpperCase()}`}
        </Send>
    </Wrapper>
);

export default SendAndClear;
