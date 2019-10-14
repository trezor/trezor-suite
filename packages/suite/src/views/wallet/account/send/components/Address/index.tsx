import React from 'react';
import { Input, Button, Icon, colors } from '@trezor/components';
import styled from 'styled-components';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';
import commonMessages from '@wallet-views/messages';
import { VALIDATION_ERRORS } from '@wallet-constants/sendForm';

import { Output } from '@wallet-types/sendForm';
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
    outputId: number;
    error: Output['address']['error'];
    address: Output['address']['value'];
    sendFormActions: DispatchProps['sendFormActions'];
    openQrModal: DispatchProps['openQrModal'];
}

const getErrorMessage = (error: Output['address']['error']) => {
    switch (error) {
        case VALIDATION_ERRORS.IS_EMPTY:
            return <FormattedMessage {...messages.TR_ADDRESS_IS_NOT_SET} />;
        case VALIDATION_ERRORS.NOT_VALID:
            return <FormattedMessage {...messages.TR_ADDRESS_IS_NOT_VALID} />;
        default:
            return null;
    }
};

const getState = (error: Output['address']['error'], address: Output['address']['value']) => {
    if (error) {
        return 'error';
    }
    if (address && !error) {
        return 'success';
    }
};

const Address = (props: Props) => (
    <Input
        state={getState(props.error, props.address)}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        autoCapitalize="off"
        topLabel={props.intl.formatMessage(commonMessages.TR_ADDRESS)}
        bottomText={getErrorMessage(props.error)}
        value={props.address || ''}
        onChange={e => props.sendFormActions.handleAddressChange(props.outputId, e.target.value)}
        sideAddons={
            <QrButton
                key="qrButton"
                variant="white"
                onClick={() => props.openQrModal(props.outputId)}
            >
                <Icon size={25} color={colors.TEXT_SECONDARY} icon="QRCODE" />
            </QrButton>
        }
    />
);

export default injectIntl(Address);
