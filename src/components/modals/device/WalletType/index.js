/* @flow */

import React, { Component } from 'react';
import styled, { css } from 'styled-components';
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
`;

const Header = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
`;

const StyledHeading = styled(H3)`
    padding-top: 30px;
`;

const StyledLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 10px;
`;

const StyledButton = styled(Button)`
    margin: 10px 0 10px 0;
`;

const StyledIcon = styled(Icon)`
    position: absolute;
    top: 10px;
    right: 15px;

    &:hover {
        cursor: pointer;
    }
`;

const Content = styled.div`
    padding: 55px 48px 40px 48px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    ${props => props.isTop && css`
        border-bottom: 1px solid ${colors.DIVIDER};
    `}
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

    changeType(hidden: boolean) {
        const { modal } = this.props;
        if (!modal.opened) return;
        this.props.modalActions.onWalletTypeRequest(modal.device, hidden);
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
                <StyledHeading>Change wallet type for { device.instanceLabel }</StyledHeading>
                <Content isTop>
                    <Header>
                        <WalletTypeIcon type="standard" size={24} color={colors.TEXT_SECONDARY} />
                        Standard Wallet
                    </Header>
                    <P isSmaller>Continue to access your standard wallet.</P>
                    <StyledButton onClick={() => this.changeType(false)}>Go to your standard wallet</StyledButton>
                </Content>
                <Content>
                    <Tooltip
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
                    </Tooltip>
                    <Header>
                        <WalletTypeIcon
                            type="hidden"
                            size={24}
                            color={colors.TEXT_SECONDARY}
                        />
                        Hidden Wallet
                    </Header>
                    <P isSmaller>You will be asked to enter your passphrase to unlock your hidden wallet.</P>
                    <StyledButton isWhite onClick={() => this.changeType(true)}>Go to your hidden wallet</StyledButton>
                </Content>
            </Wrapper>
        );
    }
}

export default WalletType;