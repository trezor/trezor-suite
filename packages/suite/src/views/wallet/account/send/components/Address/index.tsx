import React from 'react';
import { Input, Button, Icon, colors } from '@trezor/components';
import styled from 'styled-components';
import { injectIntl, InjectedIntl } from 'react-intl';
import commonMessages from '@wallet-views/messages';

const QrButton = styled(Button)`
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    border-left: 0px;
    height: 40px;
    padding: 0 10px;
`;

interface Props {
    intl: InjectedIntl;
}

const Address = (props: Props) => (
    <Input
        state={undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        topLabel={props.intl.formatMessage(commonMessages.TR_ADDRESS)}
        bottomText={null}
        value=""
        onChange={() => console.log('click')}
        sideAddons={[
            <QrButton key="qrButton" isWhite onClick={() => console.log('click')}>
                <Icon size={25} color={colors.TEXT_SECONDARY} icon="QRCODE" />
            </QrButton>,
        ]}
    />
);

export default injectIntl(Address);
