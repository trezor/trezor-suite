import React from 'react';
import { State as SendFormState } from '@wallet-types/sendForm';
import styled from 'styled-components';
import { P, Prompt, colors, variables } from '@trezor/components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { FormattedMessage } from 'react-intl';
import { TrezorDevice } from '@suite-types';
import { Account } from '@wallet-types';

import l10nMessages from './messages';

const { LINE_HEIGHT, FONT_SIZE, FONT_WEIGHT } = variables;

const Wrapper = styled.div`
    max-width: 480px;
`;

const Header = styled.div`
    padding: 30px 48px;
`;

const Content = styled.div`
    border-top: 1px solid ${colors.DIVIDER};
    background: ${colors.MAIN};
    border-radius: 4px;
    padding: 15px 0;
`;

const StyledP = styled(P)`
    display: flex;
    justify-content: left;
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
    padding: 0 3px 6px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: ${FONT_WEIGHT.MEDIUM};
    font-size: ${FONT_SIZE.BIG};
    color: ${colors.TEXT_SECONDARY};
`;

const Symbol = styled.div`
    text-transform: uppercase;
    font-size: ${FONT_SIZE.BIG};
`;

const FeeLevelName = styled.div`
    padding: 20px 0;
`;

const Value = styled.div`
    font-size: ${FONT_SIZE.BIG};
    font-weight: ${FONT_WEIGHT.MEDIUM};
    padding: 0 5px 0 0;
`;

const OutputWrapper = styled.div`
    display: flex;
    padding: 15px 48px;
    flex-direction: column;
    border-bottom: 1px solid ${colors.DIVIDER};
`;

const Row = styled.div`
    display: flex;
    justify-content: ${(props: { centered?: boolean }) =>
        props.centered ? 'center' : 'flex-start'};
`;

interface Props {
    device: TrezorDevice;
    account: Account | null;
    sendForm: SendFormState | null;
}

const ConfirmSignTx = ({ device, sendForm, account }: Props) => {
    if (!account || !sendForm || !sendForm.networkTypeBitcoin.transactionInfo) return null;
    const { outputs } = sendForm;
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
                <P>
                    <FormattedMessage {...l10nMessages.TR_DETAILS_ARE_SHOWN_ON} />
                </P>
            </Header>
            <Content>
                <Label>
                    <FormattedMessage {...l10nMessages.TR_SEND_LABEL} />
                </Label>
                {outputs.map(output => (
                    <OutputWrapper key={output.id}>
                        <Row>
                            <Value>{`${output.amount.value || '0'} `}</Value>
                            <Symbol>{account.symbol}</Symbol>
                        </Row>
                        <Row>
                            <Label>
                                <FormattedMessage {...l10nMessages.TR_TO_LABEL} />
                            </Label>
                            <Address>{output.address.value}</Address>
                        </Row>
                    </OutputWrapper>
                ))}
                <FeeLevelName>
                    <Label>
                        <FormattedMessage {...l10nMessages.TR_FEE_LABEL} />
                    </Label>
                    <Row centered>
                        <Value>
                            {sendForm.networkTypeBitcoin.transactionInfo.type !== 'error' &&
                                formatNetworkAmount(
                                    sendForm.networkTypeBitcoin.transactionInfo.fee,
                                    account.symbol,
                                )}
                        </Value>
                        <Symbol>{account.symbol}</Symbol>
                    </Row>
                </FeeLevelName>
            </Content>
        </Wrapper>
    );
};

export default ConfirmSignTx;
