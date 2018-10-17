import React, { Component } from 'react';
import styled from 'styled-components';
import Input from 'components/inputs/Input';
import PropTypes from 'prop-types';
import Textarea from 'components/Textarea';
import Title from 'views/Wallet/components/Title';
import Button from 'components/Button';
import Content from 'views/Wallet/components/Content';
import colors from 'config/colors';

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

class SignVerify extends Component {
    constructor(props) {
        super(props);
        this.state = {
            sign: {
                address: '',
                message: '',
                signature: '',
            },
            verify: {
                address: '',
                message: '',
                signature: '',
            },
        };
    }

    getPath() {
        return this.props.selectedAccount.account.addressPath;
    }

    handleSignInput = (e) => {
        this.setState({ sign: { [e.target.name]: e.target.value } });
    }

    handleVerifyInput = (e) => {
        this.setState({ verify: { [e.target.name]: e.target.value } });
        console.log(this.state);
    }

    clearSign = () => {
        this.setState({
            sign: {
                address: '',
                message: '',
                signature: '',
            },
        });
    }

    clearVerify = () => {
        this.setState({
            verify: {
                address: '',
                message: '',
                signature: '',
            },
        });
    }

    render() {
        const { signVerifyActions } = this.props;
        return (
            <Content>
                <Title>Sign & Verify</Title>
                <Wrapper>
                    <Sign>
                        <Row>
                            <Label>Address</Label>
                            <Input
                                name="address"
                                value={this.state.sign.address}
                                onChange={this.handleSignInput}
                                height={50}
                                type="text"
                                disabled
                            />
                        </Row>
                        <Row>
                            <Label>Message</Label>
                            <Textarea
                                name="message"
                                value={this.state.sign.message}
                                onChange={this.handleSignInput}
                                rows="2"
                                maxLength="255"
                            />
                        </Row>
                        <Row>
                            <Label>Signature</Label>
                            <Textarea
                                name="signature"
                                value={this.state.sign.signature}
                                onChange={this.handleSign}
                                rows="2"
                                maxLength="255"
                                disabled
                            />
                        </Row>
                        <RowButtons>
                            <Button
                                onClick={this.clearVerify}
                                isWhite
                            >Clear
                            </Button>
                            <StyledButton
                                onClick={() => signVerifyActions.sign(this.getPath(), this.state.sign.message)}
                            >Sign
                            </StyledButton>
                        </RowButtons>
                    </Sign>
                    <Verify>
                        <Row>
                            <Label>Address</Label>
                            <Input
                                name="address"
                                value={this.state.verify.address}
                                onChange={this.handleVerifyInput}
                                type="text"
                            />
                        </Row>
                        <Row>
                            <Label>Message</Label>
                            <Textarea
                                name="message"
                                value={this.state.verify.message}
                                onChange={this.handleVerifyInput}
                                rows="4"
                                maxLength="255"
                            />
                        </Row>
                        <Row>
                            <Label>Signature</Label>
                            <Textarea
                                name="signature"
                                value={this.state.verify.signature}
                                onChange={this.handleVerifyInput}
                                rows="4"
                                maxLength="255"
                            />
                        </Row>
                        <RowButtons>
                            <Button
                                onClick={this.clearSign}
                                isWhite
                            >Clear
                            </Button>
                            <StyledButton>Verify</StyledButton>
                        </RowButtons>
                    </Verify>
                </Wrapper>
            </Content>
        );
    }
}

SignVerify.propTypes = {
    sign: PropTypes.func.isRequired,
};

export default SignVerify;