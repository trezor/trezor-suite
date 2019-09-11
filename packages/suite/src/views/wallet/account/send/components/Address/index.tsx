import React from 'react';
import { Input, Button, Icon, colors } from '@trezor/components';
import styled from 'styled-components';
import { injectIntl, InjectedIntl, FormattedMessage } from 'react-intl';
import commonMessages from '@wallet-views/messages';
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
    error: 'empty' | 'not-valid';
    value: string;
    sendFormActions: DispatchProps['sendFormActions'];
}

const getErrorMessage = (error: 'empty' | 'not-valid') => {
    switch (error) {
        case 'empty':
            return <FormattedMessage {...messages.TR_ADDRESS_IS_NOT_SET} />;
        case 'not-valid':
            return <FormattedMessage {...messages.TR_ADDRESS_IS_NOT_VALID} />;
        // no default
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
        value={props.value}
        onChange={e => props.sendFormActions.handleAddressChange(e.target.value)}
        sideAddons={[
            <QrButton key="qrButton" isWhite onClick={() => console.log('qr button click')}>
                <Icon size={25} color={colors.TEXT_SECONDARY} icon="QRCODE" />
            </QrButton>,
        ]}
    />
);

export default injectIntl(Address);
