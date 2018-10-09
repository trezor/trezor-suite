/* @flow */
import React, { Component } from 'react';
import { H2 } from 'components/Heading';
import P from 'components/Paragraph';
import styled from 'styled-components';
import Icon from 'components/Icon';
import colors from 'config/colors';
import icons from 'config/icons';
import Button from 'components/Button';
import Link from 'components/Link';

import type { Props } from '../../index';

const StyledLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 15px;
`;

const Wrapper = styled.div`
    width: 370px;
    padding: 24px 48px;
`;

const StyledP = styled(P)`
    padding: 10px 0px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 0;
`;

const StyledButton = styled(Button)`
    margin: 0 0 10px 0;
`;

class ConfirmUnverifiedAddress extends Component<Props> {
    componentDidMount(): void {
        this.keyboardHandler = this.keyboardHandler.bind(this);
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount(): void {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    keyboardHandler: (event: KeyboardEvent) => void;

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.verifyAddress();
        }
    }

    verifyAddress() {
        if (!this.props.modal.opened) return;
        const {
            account,
        } = this.props.selectedAccount;
        this.props.modalActions.onCancel();
        this.props.receiveActions.showAddress(account.addressPath);
    }

    showUnverifiedAddress() {
        if (!this.props.modal.opened) return;

        this.props.modalActions.onCancel();
        this.props.receiveActions.showUnverifiedAddress();
    }

    render() {
        if (!this.props.modal.opened) return null;
        const {
            device,
        } = this.props.modal;

        const {
            onCancel,
        } = this.props.modalActions;

        let deviceStatus: string;
        let claim: string;

        if (!device.connected) {
            deviceStatus = `${device.label} is not connected`;
            claim = 'Please connect your device';
        } else {
            // corner-case where device is connected but it is unavailable because it was created with different "passphrase_protection" settings
            const enable: string = device.features && device.features.passphrase_protection ? 'enable' : 'disable';
            deviceStatus = `${device.label} is unavailable`;
            claim = `Please ${enable} passphrase settings`;
        }

        return (
            <Wrapper>
                <StyledLink onClick={onCancel}>
                    <Icon size={20} color={colors.TEXT_SECONDARY} icon={icons.CLOSE} />
                </StyledLink>
                <H2>{ deviceStatus }</H2>
                <StyledP isSmaller>To prevent phishing attacks, you should verify the address on your TREZOR first. { claim } to continue with the verification process.</StyledP>
                <Row>
                    <StyledButton onClick={() => (!this.props.selectedAccount.account ? this.verifyAddress() : 'false')}>Try again</StyledButton>
                    <StyledButton isWhite onClick={() => this.showUnverifiedAddress()}>Show unverified address</StyledButton>
                </Row>
            </Wrapper>
        );
    }
}

export default ConfirmUnverifiedAddress;