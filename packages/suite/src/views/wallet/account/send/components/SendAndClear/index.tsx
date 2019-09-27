import React from 'react';
import styled from 'styled-components';
import { Button } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import commonMessages from '@wallet-views/messages';
import messages from './index.messages';
import { DispatchProps } from '../../Container';
import { Account } from '@wallet-types';

const Wrapper = styled.div`
    display: flex;
    flex: 1;

    justify-content: flex-end;

    & button {
        margin-left: 10px;
    }
`;

const Send = styled(Button)`
    min-width: 200px;
`;

const Clear = styled(Button)``;

interface Props {
    sendFormActions: DispatchProps['sendFormActions'];
    sendFormActionsBitcoin: DispatchProps['sendFormActionsBitcoin'];
    sendFormActionsEthereum: DispatchProps['sendFormActionsEthereum'];
    sendFormActionsRipple: DispatchProps['sendFormActionsRipple'];
    networkType: Account['networkType'];
    symbol: Account['symbol'];
}

const isDisabled = () => {
    // handle all errors from all outputs
    return false;
};

const SendAndClear = (props: Props) => (
    <Wrapper>
        <Clear variant="white" onClick={() => props.sendFormActions.clear()}>
            <FormattedMessage {...commonMessages.TR_CLEAR} />
        </Clear>
        {props.networkType === 'bitcoin' && (
            <Button variant="white" onClick={() => props.sendFormActionsBitcoin.addRecipient()}>
                <FormattedMessage {...messages.TR_ADD_RECIPIENT} />
            </Button>
        )}
        <Send
            isDisabled={false}
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
            {isDisabled() ? 'Send' : `Send x ${props.symbol.toUpperCase()}`}
        </Send>
    </Wrapper>
);

export default SendAndClear;
