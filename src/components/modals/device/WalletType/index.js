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
import { FormattedMessage, injectIntl } from 'react-intl';

import type { TrezorDevice } from 'flowtype';
import l10nCommonMessages from 'views/common.messages';
import l10nMessages from './index.messages';
import type { Props as BaseProps } from '../../Container';

type Props = {
    intl: any,
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
                <StyledHeading>{ device.state
                    ? (
                        <FormattedMessage
                            {...l10nMessages.TR_CHANGE_WALLET_TYPE_FOR}
                            values={{ deviceLabel: device.instanceLabel }}
                        />
                    ) : (
                        <FormattedMessage
                            {...l10nMessages.TR_SELECT_WALLET_TYPE_FOR}
                            values={{ deviceLabel: device.instanceLabel }}
                        />
                    )}
                </StyledHeading>
                <Content isTop>
                    <Header>
                        <WalletTypeIcon type="standard" size={32} color={colors.TEXT_PRIMARY} />
                        <FormattedMessage {...l10nMessages.TR_STANDARD_WALLET} />
                    </Header>
                    <P isSmaller>
                        <FormattedMessage {...l10nMessages.TR_CONTINUE_TO_ACCESS_STANDARD_WALLET} />
                    </P>
                    <StyledButton onClick={() => onWalletTypeRequest(false)}>
                        <FormattedMessage {...l10nCommonMessages.TR_GO_TO_STANDARD_WALLET} />
                    </StyledButton>
                </Content>
                <Content>
                    <Tooltip
                        maxWidth={285}
                        placement="top"
                        content={this.props.intl.formatMessage(l10nMessages.TR_PASSPHRASE_IS_OPTIONAL_FEATURE)}
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
                        <FormattedMessage {...l10nMessages.TR_HIDDEN_WALLET} />
                    </Header>
                    <P isSmaller>
                        <FormattedMessage {...l10nMessages.TR_ASKED_ENTER_YOUR_PASSPHRASE_TO_UNLOCK} />
                    </P>
                    <StyledButton isWhite onClick={() => onWalletTypeRequest(true)}>
                        <FormattedMessage {...l10nCommonMessages.TR_GO_TO_HIDDEN_WALLET} />
                    </StyledButton>
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

export default injectIntl(WalletType);