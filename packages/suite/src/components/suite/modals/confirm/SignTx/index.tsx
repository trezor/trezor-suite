import React from 'react';
import { State as SendFormState } from '@wallet-types/sendForm';
import styled from 'styled-components';
import { P, Prompt, colors, variables } from '@trezor/components';
import { FormattedMessage } from 'react-intl';
import { TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';

import l10nMessages from './messages';

const { LINE_HEIGHT, FONT_SIZE, FONT_WEIGHT } = variables;

const Wrapper = styled.div`
    max-width: 450px;
`;

const Header = styled.div`
    padding: 30px 48px;
`;

const Content = styled.div`
    border-top: 1px solid ${colors.DIVIDER};
    background: ${colors.MAIN};
    padding: 30px 48px;
    border-radius: 4px;
`;

const StyledP = styled(P)`
    padding-bottom: 20px;
    text-align: center;
    color: ${colors.TEXT};
    font-size: ${FONT_SIZE.BASE};
    &:last-child {
        padding-bottom: 0px;
    }
`;

const Address = styled(StyledP)`
    word-wrap: break-word;
    line-height: ${LINE_HEIGHT.SMALL};
`;

const Label = styled.div`
    padding-bottom: 6px;
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const FeeLevelName = styled(StyledP)`
    padding-bottom: 0px;
`;

interface Props {
    device: TrezorDevice;
    account: Account;
    sendForm: SendFormState | null;
}

const ConfirmSignTx = ({ device, sendForm, account }: Props) => {
    if (!sendForm) return null;
    const { outputs } = sendForm;
    const selectedFeeLevel = sendForm.selectedFee;
    const majorVersion = device.features ? device.features.major_version : 2;

    return (
        <Wrapper>
            <Header>
                <Prompt model={majorVersion}>
                    <FormattedMessage
                        {...l10nMessages.TR_CONFIRM_TRANSACTION_ON}
                        values={{ deviceLabel: device.label }}
                    />
                </Prompt>
                <P textAlign="center" size="small">
                    <FormattedMessage {...l10nMessages.TR_DETAILS_ARE_SHOWN_ON} />
                </P>
            </Header>
            <Content>
                <Label>
                    <FormattedMessage {...l10nMessages.TR_SEND_LABEL} />
                </Label>
                {outputs.map(output => (
                    <>
                        <StyledP>{`${output.amount.value || '0'} ${account.symbol}`}</StyledP>
                        <Label>
                            <FormattedMessage {...l10nMessages.TR_TO_LABEL} />
                        </Label>
                        <Address>{output.address.value}</Address>
                        <Label>
                            <FormattedMessage {...l10nMessages.TR_FEE_LABEL} />
                        </Label>
                        <FeeLevelName>{selectedFeeLevel.value}</FeeLevelName>
                        <StyledP>{selectedFeeLevel.label}</StyledP>
                    </>
                ))}
            </Content>
        </Wrapper>
    );
};

export default ConfirmSignTx;
