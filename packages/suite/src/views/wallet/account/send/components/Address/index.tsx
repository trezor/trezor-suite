import React from 'react';
import { Input, Button, Icon, colors } from '@trezor/components';
import styled from 'styled-components';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';
import commonMessages from '@wallet-views/messages';

import { State } from '@wallet-reducers/sendFormReducer';
import messages from './index.messages';
import { DispatchProps } from '../../Container';

const QrButton = styled(Button)`
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    border-left: 0px;
    height: 40px;
    padding: 0 10px;
`;

interface Props {
    intl: InjectedIntl;
    error: State['errors']['address'];
    value: State['address'];
    sendFormActions: DispatchProps['sendFormActions'];
}

const getErrorMessage = (error: State['errors']['address']) => {
    switch (error) {
        case 'empty':
            return <FormattedMessage {...messages.TR_ADDRESS_IS_NOT_SET} />;
        case 'not-valid':
            return <FormattedMessage {...messages.TR_ADDRESS_IS_NOT_VALID} />;
        default:
            return null;
    }
};

const Address = (props: Props) => (
    <Input
        state={props.error ? 'error' : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        topLabel={props.intl.formatMessage(commonMessages.TR_ADDRESS)}
        bottomText={getErrorMessage(props.error)}
        value={props.value || ''}
        onChange={e => props.sendFormActions.handleAddressChange(e.target.value)}
        sideAddons={[
            <QrButton key="qrButton" isWhite onClick={() => console.log('qr button click')}>
                <Icon size={25} color={colors.TEXT_SECONDARY} icon="QRCODE" />
            </QrButton>,
        ]}
    />
);

export default injectIntl(Address);
