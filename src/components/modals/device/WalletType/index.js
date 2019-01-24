/* @flow */

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'styled-components';

import icons from 'config/icons';
import colors from 'config/colors';

import { H2 } from 'components/Heading';
import P from 'components/Paragraph';
import Button from 'components/Button';
import Tooltip from 'components/Tooltip';
import Icon from 'components/Icon';
import Link from 'components/Link';
import WalletTypeIcon from 'components/images/WalletType';

import type { TrezorDevice } from 'flowtype';
import type { Props as BaseProps } from '../../Container';

type Props = {
    device: TrezorDevice;
    onWalletTypeRequest: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onWalletTypeRequest'>;
    onCancel: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onCancel'>;
}

const Wrapper = styled.div`
`;

const Header = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;

    color: ${colors.TEXT_PRIMARY};
`;

const StyledHeading = styled(H2)`
    padding: 30px 48px 10px 48px;
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
        padding-top: 40px;
        border-bottom: 1px solid ${colors.DIVIDER};
    `}
`;

class WalletType extends PureComponent<Props> {
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
            this.props.onWalletTypeRequest(false);
        }
    }

    keyboardHandler: (event: KeyboardEvent) => void;

    render() {
        const { device, onCancel, onWalletTypeRequest } = this.props;

        return (
            <Wrapper>
                { device.state && (
                    <StyledLink onClick={onCancel}>
                        <Icon
                            size={24}
                            color={colors.TEXT_SECONDARY}
                            icon={icons.CLOSE}
                        />
                    </StyledLink>
                )}
                <StyledHeading>{ device.state ? 'Change' : 'Select' } wallet type for { device.instanceLabel }</StyledHeading>
                <Content isTop>
                    <Header>
                        <WalletTypeIcon type="standard" size={32} color={colors.TEXT_PRIMARY} />
                        Standard Wallet
                    </Header>
                    <P isSmaller>Continue to access your standard wallet.</P>
                    <StyledButton onClick={() => onWalletTypeRequest(false)}>Go to your standard wallet</StyledButton>
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
                            size={26}
                        />
                    </Tooltip>
                    <Header>
                        <WalletTypeIcon
                            type="hidden"
                            size={32}
                            color={colors.TEXT_PRIMARY}
                        />
                        Hidden Wallet
                    </Header>
                    <P isSmaller>You will be asked to enter your passphrase to unlock your hidden wallet.</P>
                    <StyledButton isWhite onClick={() => onWalletTypeRequest(true)}>Go to your hidden wallet</StyledButton>
                </Content>
            </Wrapper>
        );
    }
}

WalletType.propTypes = {
    device: PropTypes.object.isRequired,
    onWalletTypeRequest: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default WalletType;