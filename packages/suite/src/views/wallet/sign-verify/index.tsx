import React, { Component } from 'react';
import styled from 'styled-components';
import { Input, Button, Textarea, variables } from '@trezor/components';
import Title from '@wallet-components/Title';
import { WalletLayout } from '@wallet-components';
import * as signVerifyActions from '@wallet-actions/signVerifyActions';
import { WrappedComponentProps } from 'react-intl';
import { Translation } from '@suite-components/Translation';
import messages from '@suite/support/messages';
import { StateProps, DispatchProps } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    flex-direction: row;
    color: ${props => props.theme.BG_WHITE};

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex-wrap: wrap;
    }
`;

const Row = styled.div`
    padding-bottom: 28px;
`;

const RowButtons = styled(Row)`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const StyledButton = styled(Button)`
    width: 110px;
    margin-left: 10px;

    &:first-child {
        margin-left: 0;
    }
`;

const Column = styled.div`
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        flex: 1 1 100%;
    }
`;

const Sign = styled(Column)``;

const Verify = styled(Column)`
    padding-left: 20px;

    @media screen and (max-width: ${variables.SCREEN_SIZE.MD}) {
        padding-left: 0px;
    }
`;

interface Props extends WrappedComponentProps {
    selectedAccount: StateProps['selectedAccount'];
    signVerify: StateProps['signVerify'];
    signVerifyActions: DispatchProps['signVerifyActions'];
}

interface FormEvent {
    target: {
        name: string;
        value: string;
    };
}

type InputNameType = Parameters<typeof signVerifyActions.inputChange>;

class SignVerify extends Component<Props> {
    getError(inputName: string) {
        if (!this.props.signVerify) return null;
        return this.props.signVerify.errors.find(e => e.inputName === inputName);
    }

    handleInputChange = (event: FormEvent) => {
        this.props.signVerifyActions.inputChange(
            event.target.name as InputNameType[0],
            event.target.value,
        );
    };

    render() {
        const {
            intl,
            selectedAccount,
            signVerifyActions,
            signVerify: {
                signMessage,
                signSignature,
                verifyAddress,
                verifyMessage,
                verifySignature,
                errors,
            },
        } = this.props;

        const verifyAddressError = this.getError('verifyAddress');
        return (
            <WalletLayout title="TR_NAV_SIGN_VERIFY" account={selectedAccount}>
                <Wrapper>
                    <Sign>
                        <Title>
                            <Translation id="TR_SIGN_MESSAGE" />
                        </Title>
                        <Row>
                            <Input
                                label={intl.formatMessage(messages.TR_ADDRESS)}
                                name="signAddress"
                                value=""
                                // value={account.descriptor}
                                type="text"
                                readOnly
                            />
                        </Row>
                        <Row>
                            <Textarea
                                label={intl.formatMessage(messages.TR_MESSAGE)}
                                name="signMessage"
                                value={signMessage}
                                onChange={this.handleInputChange}
                                rows={4}
                                maxRows={4}
                                maxLength={255}
                            />
                        </Row>
                        <Row>
                            <Textarea
                                label={intl.formatMessage(messages.TR_SIGNATURE)}
                                name="signSignature"
                                value={signSignature}
                                rows={4}
                                maxRows={4}
                                maxLength={255}
                                readOnly
                            />
                        </Row>
                        <RowButtons>
                            <StyledButton
                                onClick={this.props.signVerifyActions.clearSign}
                                variant="secondary"
                            >
                                <Translation id="TR_CLEAR" />
                            </StyledButton>
                            <StyledButton
                                // isDisabled={!device.connected}
                                isDisabled={false}
                                // TODO:
                                // onClick={() =>
                                //      signVerifyActions.sign(account.accountPath, signMessage)
                                // }
                            >
                                <Translation id="TR_SIGN" />
                            </StyledButton>
                        </RowButtons>
                    </Sign>
                    <Verify>
                        <Title>
                            <Translation id="TR_VERIFY_MESSAGE" />
                        </Title>
                        <Row>
                            <Input
                                label={intl.formatMessage(messages.TR_ADDRESS)}
                                name="verifyAddress"
                                value={verifyAddress}
                                onChange={this.handleInputChange}
                                type="text"
                                state={verifyAddressError ? 'error' : undefined}
                                bottomText={verifyAddressError ? verifyAddressError.message : null}
                            />
                        </Row>
                        <Row>
                            <Textarea
                                label={intl.formatMessage(messages.TR_MESSAGE)}
                                name="verifyMessage"
                                value={verifyMessage}
                                onChange={this.handleInputChange}
                                rows={4}
                                maxRows={4}
                                maxLength={255}
                            />
                        </Row>
                        <Row>
                            <Textarea
                                label={intl.formatMessage(messages.TR_SIGNATURE)}
                                name="verifySignature"
                                value={verifySignature}
                                onChange={this.handleInputChange}
                                rows={4}
                                maxRows={4}
                                maxLength={255}
                            />
                        </Row>
                        <RowButtons>
                            <StyledButton onClick={signVerifyActions.clearVerify}>
                                <Translation id="TR_CLEAR" />
                            </StyledButton>
                            <StyledButton
                                // isDisabled={!!verifyAddressError || !device.connected}
                                isDisabled
                                onClick={() => {
                                    if (errors.length <= 0) {
                                        signVerifyActions.verify(
                                            verifyAddress,
                                            verifyMessage,
                                            verifySignature,
                                        );
                                    }
                                }}
                            >
                                <Translation id="TR_VERIFY" />
                            </StyledButton>
                        </RowButtons>
                    </Verify>
                </Wrapper>
            </WalletLayout>
        );
    }
}

export default SignVerify;
