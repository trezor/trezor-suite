import React, { FunctionComponent } from 'react';
import styled from 'styled-components';
import { Translation } from '@suite-components/Translation';
import { P, Prompt, colors, variables } from '@trezor/components';
import { TrezorDevice } from '@suite-types';
import { Account, Network } from '@wallet-types';
import messages from '@suite/support/messages';

const { FONT_SIZE } = variables;

interface Props {
    device: TrezorDevice;
    account: Account;
    network: Network;
}

const Wrapper = styled.div`
    max-width: 390px;
`;

const Header = styled.div`
    padding: 30px 48px;
`;

const Content = styled.div`
    border-top: 1px solid ${colors.DIVIDER};
    background: ${colors.MAIN};
    padding: 24px 48px;
`;

const Label = styled.div`
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const ConfirmAddress: FunctionComponent<Props> = ({ device, account, network }) => {
    const majorVersion = device.features ? device.features.major_version : 2;

    return (
        <Wrapper>
            <Header>
                <Prompt model={majorVersion}>
                    <Translation {...messages.TR_CONFIRM_ADDRESS_ON_TREZOR} />
                </Prompt>
                <P>
                    <Translation {...messages.TR_PLEASE_COMPARE_YOUR_ADDRESS} />
                </P>
            </Header>
            <Content>
                <P>{account.descriptor}</P>
                <Label>
                    {network.symbol}
                    <Translation
                        {...messages.TR_ACCOUNT_HASH}
                        values={{ number: account.index + 1 }}
                    />
                </Label>
            </Content>
        </Wrapper>
    );
};

export default ConfirmAddress;
