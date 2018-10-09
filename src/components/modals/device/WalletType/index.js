/* @flow */

import React, { Component } from 'react';
import styled from 'styled-components';
import { H3 } from 'components/Heading';
import P from 'components/Paragraph';
import Button from 'components/Button';
import Tooltip from 'components/Tooltip';
import Icon from 'components/Icon';
import Link from 'components/Link';
import colors from 'config/colors';
import icons from 'config/icons';
import WalletTypeIcon from 'components/images/WalletType';

import type { Props } from 'components/modals/index';

const Wrapper = styled.div`
    width: 360px;
    padding: 24px 48px;
`;

const StyledLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 15px;
`;

const StyledButton = styled(Button)`
    margin: 0 0 10px 0;
`;

const StyledTooltip = styled(Tooltip)`
    position: absolute;
    right: 0px;
    top: 1px;
`;

const StyledIcon = styled(Icon)`
    position: relative;
    top: -1px;
    &:hover {
        cursor: pointer;
    }
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 0;
`;

const Span = styled.div`
    position: relative;
    display: flex;
    align-items: center;
    flex-direction: row;
    justify-content: center;
`;

const Divider = styled.div`
    margin: 20px 0;
    border-top: 1px solid ${colors.DIVIDER};
`;

class WalletType extends Component<Props> {
    constructor(props: Props) {
        super(props);
        this.keyboardHandler = this.keyboardHandler.bind(this);
    }

    componentDidMount() {
        window.addEventListener('keydown', this.keyboardHandler, false);
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this.keyboardHandler, false);
    }

    keyboardHandler(event: KeyboardEvent): void {
        if (event.keyCode === 13) {
            event.preventDefault();
            this.changeType(false);
        }
    }

    keyboardHandler: (event: KeyboardEvent) => void;

    changeType(hidden: boolean, state: ?string) {
        const { modal } = this.props;
        if (!modal.opened) return;
        this.props.modalActions.onWalletTypeRequest(modal.device, hidden, state);
    }

    render() {
        if (!this.props.modal.opened) return null;
        const { device } = this.props.modal;
        const { onCancel } = this.props.modalActions;

        return (
            <Wrapper>
                { device.state && (
                    <StyledLink onClick={onCancel}>
                        <Icon size={20} color={colors.TEXT_SECONDARY} icon={icons.CLOSE} />
                    </StyledLink>
                )}
                <H3>RequestWalletType for { device.instanceLabel }?</H3>
                <Row>
                    <Span>
                        <WalletTypeIcon type="standard" size={24} color={colors.TEXT_SECONDARY} />
                        Standard Wallet
                    </Span>
                    <P isSmaller>Continue to access your standard wallet.</P>
                    <StyledButton onClick={() => this.changeType(false, device.state)}>Go to your standard wallet</StyledButton>
                    <Divider />
                    <Span>
                        <WalletTypeIcon type="hidden" size={24} color={colors.TEXT_SECONDARY} />
                        Hidden Wallet
                        <StyledTooltip
                            maxWidth={285}
                            placement="top"
                            content="Passphrase is an optional feature of the Trezor device that is recommended for advanced users only. It is a word or a sentence of your choice. Its main purpose is to access a hidden wallet."
                            readMoreLink="https://wiki.trezor.io/Passphrase"
                        >
                            <StyledIcon
                                icon={icons.HELP}
                                color={colors.TEXT_SECONDARY}
                                size={24}
                            />
                        </StyledTooltip>
                    </Span>
                    <P isSmaller>You will be asked to enter your passphrase to unlock your hidden wallet.</P>
                    <StyledButton isWhite onClick={() => this.changeType(true, device.state)}>Go to your hidden wallet</StyledButton>
                </Row>
            </Wrapper>
        );
    }
}

export default WalletType;