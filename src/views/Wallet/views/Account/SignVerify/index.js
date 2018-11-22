/* @flow */
import React, { Component } from 'react';
import styled from 'styled-components';
import Input from 'components/inputs/Input';
import Textarea from 'components/Textarea';
import { validateAddress } from 'utils/ethUtils';
import Title from 'views/Wallet/components/Title';
import Button from 'components/Button';
import Content from 'views/Wallet/components/Content';
import colors from 'config/colors';

import type { Props, SignVerifyState } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    margin-top: -5px;
    flex-direction: row;
    background: ${colors.WHITE};
`;

const Row = styled.div`
    padding: 0 0 25px 0;
`;

const RowButtons = styled(Row)`
    display: flex;
    align-items: center;
    justify-content: flex-end;
`;

const StyledButton = styled(Button)`
    margin-left: 10px;
    width: 110px;
`;

const Column = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
`;

const Sign = styled(Column)``;

const Verify = styled(Column)`
    padding-left: 20px;
`;

class SignVerify extends Component <Props, SignVerifyState> {
    handleInputChange = (event: SyntheticInputEvent<Text>) => {
        this.props.signVerifyActions.inputChange(event.target.name, event.target.value);
    }

    render() {
        const device = this.props.wallet.selectedDevice;
        const {
            account, discovery, shouldRender, notification,
        } = this.props.selectedAccount;
        const { type, title, message } = notification;
        if (!device || !account || !discovery || !shouldRender) return <Content type={type} title={title} message={message} isLoading />;
        const {
            signVerifyActions,
            signVerify: {
                signMessage,
                signSignature,
                verifyAddress,
                verifyMessage,
                verifySignature,
                touched,
            },
        } = this.props;

        return (
            <Content>
                <Title>Sign & Verify</Title>
                <Wrapper>
                    <Sign>
                        <Row>
                            <Input
                                topLabel="Address"
                                name="signAddress"
                                value={account.address}
                                height={50}
                                type="text"
                                isSmallText
                                isDisabled
                            />
                        </Row>
                        <Row>
                            <Textarea
                                topLabel="Message"
                                name="signMessage"
                                value={signMessage}
                                onChange={this.handleInputChange}
                                rows={4}
                                maxRows={4}
                                maxLength="255"
                            />
                        </Row>
                        <Row>
                            <Textarea
                                topLabel="Signature"
                                name="signSignature"
                                value={signSignature}
                                rows={4}
                                maxRows={4}
                                maxLength="255"
                                isDisabled
                            />
                        </Row>
                        <RowButtons>
                            <Button
                                onClick={this.props.signVerifyActions.clearSign}
                                isWhite
                            >Clear
                            </Button>
                            <StyledButton
                                onClick={() => signVerifyActions.sign(account.addressPath, signMessage)}
                            >Sign
                            </StyledButton>
                        </RowButtons>
                    </Sign>
                    <Verify>
                        <Row>
                            <Input
                                topLabel="Address"
                                name="verifyAddress"
                                value={verifyAddress}
                                onChange={this.handleInputChange}
                                type="text"
                                state={(touched.includes('verifyAddress') && validateAddress(verifyAddress)) ? 'error' : null}
                                bottomText={touched.includes('verifyAddress') ? validateAddress(verifyAddress) : null}
                                isSmallText
                            />
                        </Row>
                        <Row>
                            <Textarea
                                topLabel="Message"
                                name="verifyMessage"
                                value={verifyMessage}
                                onChange={this.handleInputChange}
                                rows={4}
                                maxRows={4}
                                maxLength="255"
                            />
                        </Row>
                        <Row>
                            <Textarea
                                topLabel="Signature"
                                name="verifySignature"
                                value={verifySignature}
                                onChange={this.handleInputChange}
                                rows={4}
                                maxRows={4}
                                maxLength="255"
                            />
                        </Row>
                        <RowButtons>
                            <Button
                                onClick={signVerifyActions.clearVerify}
                                isWhite
                            >Clear
                            </Button>
                            <StyledButton
                                onClick={() => signVerifyActions.verify(
                                    verifyAddress,
                                    verifyMessage,
                                    verifySignature,
                                )}
                            >Verify
                            </StyledButton>
                        </RowButtons>
                    </Verify>
                </Wrapper>
            </Content>
        );
    }
}

export default SignVerify;