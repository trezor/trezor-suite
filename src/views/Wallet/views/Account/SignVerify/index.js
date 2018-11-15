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

import type { Props } from './Container';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
    margin-top: -5px;
    flex-direction: row;
    background: ${colors.WHITE};
`;

const Row = styled.div`
    padding: 0 0 10px 0;
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

const Label = styled.div`
    color: ${colors.TEXT_SECONDARY};
    padding: 5px 0px 10px 0;
`;

type State = {
    signMessage: string,
    verifyAddress: string,
    verifyMessage: string,
    verifySignature: string
}

class SignVerify extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            signMessage: '',
            verifyAddress: '',
            verifyMessage: '',
            verifySignature: '',
        };
    }

    getAddress() {
        let result = null;
        const { selectedAccount } = this.props;
        if (selectedAccount.account && selectedAccount.account.address) {
            result = selectedAccount.account.address;
        }
        return result || 'loading...';
    }

    handleInputChange = (event: SyntheticInputEvent<Text>) => {
        this.setState({ [event.target.name]: event.target.value });
    }

    clearSign =() => {
        this.setState({
            signMessage: '',
        });
        this.props.signVerifyActions.clear();
    }

    clearVerify = () => {
        this.setState({
            verifyAddress: '',
            verifyMessage: '',
            verifySignature: '',
        });
    }

    render() {
        const device = this.props.wallet.selectedDevice;
        const {
            account,
            discovery,
            shouldRender,
            notification,
        } = this.props.selectedAccount;
        const { type, title, message } = notification;
        if (!device || !account || !discovery || !shouldRender) return <Content type={type} title={title} message={message} isLoading />;
        const {
            signVerifyActions,
            signature,
        } = this.props;
        return (
            <Content>
                <Title>Sign & Verify</Title>
                <Wrapper>
                    <Sign>
                        <Row>
                            <Label>Address</Label>
                            <Input
                                name="signAddress"
                                value={this.getAddress()}
                                height={50}
                                type="text"
                                isSmallText
                                isDisabled
                            />
                        </Row>
                        <Row>
                            <Label>Message</Label>
                            <Textarea
                                name="signMessage"
                                value={this.state.signMessage}
                                onChange={this.handleInputChange}
                                rows={4}
                                maxRows={4}
                                maxLength="255"
                            />
                        </Row>
                        <Row>
                            <Label>Signature</Label>
                            <Textarea
                                name="signSignature"
                                value={signature}
                                rows={4}
                                maxRows={4}
                                maxLength="255"
                                isDisabled
                            />
                        </Row>
                        <RowButtons>
                            <Button
                                onClick={this.clearSign}
                                isWhite
                            >Clear
                            </Button>
                            <StyledButton
                                onClick={() => signVerifyActions.sign(this.props.selectedAccount.account.addressPath, this.state.signMessage)}
                            >Sign
                            </StyledButton>
                        </RowButtons>
                    </Sign>
                    <Verify>
                        <Row>
                            <Label>Address</Label>
                            <Input
                                name="verifyAddress"
                                value={this.state.verifyAddress}
                                onChange={this.handleInputChange}
                                type="text"
                                state={(this.state.verifyAddress && validateAddress(this.state.verifyAddress)) ? 'error' : null}
                                bottomText={this.state.verifyAddress !== '' ? validateAddress(this.state.verifyAddress) : null}
                                isSmallText
                            />
                        </Row>
                        <Row>
                            <Label>Message</Label>
                            <Textarea
                                name="verifyMessage"
                                value={this.state.verifyMessage}
                                onChange={this.handleInputChange}
                                rows={4}
                                maxRows={4}
                                maxLength="255"
                            />
                        </Row>
                        <Row>
                            <Label>Signature</Label>
                            <Textarea
                                name="verifySignature"
                                value={this.state.verifySignature}
                                onChange={this.handleInputChange}
                                rows={4}
                                maxRows={4}
                                maxLength="255"
                            />
                        </Row>
                        <RowButtons>
                            <Button
                                onClick={this.clearVerify}
                                isWhite
                            >Clear
                            </Button>
                            <StyledButton
                                onClick={() => signVerifyActions.verify(
                                    this.state.verifyAddress,
                                    this.state.verifyMessage,
                                    this.state.verifySignature,
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