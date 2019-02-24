/* @flow */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

import icons from 'config/icons';
import colors from 'config/colors';

import { H2 } from 'components/Heading';
import P from 'components/Paragraph';
import Icon from 'components/Icon';
import Button from 'components/Button';
import Link from 'components/Link';
import { FormattedMessage } from 'react-intl';

import type { TrezorDevice } from 'flowtype';
import l10nMessages from './index.messages';

import type { Props as BaseProps } from '../../Container';

type Props = {
    device: TrezorDevice;
    account: $ElementType<$ElementType<BaseProps, 'selectedAccount'>, 'account'>;
    showAddress: $ElementType<$ElementType<BaseProps, 'receiveActions'>, 'showAddress'>;
    showUnverifiedAddress: $ElementType<$ElementType<BaseProps, 'receiveActions'>, 'showUnverifiedAddress'>;
    onCancel: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onCancel'>;
}

const StyledLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 15px;
`;

const Wrapper = styled.div`
    max-width: 370px;
    padding: 30px 48px;
`;

const StyledP = styled(P)`
    padding: 20px 0px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;

    Button + Button {
        margin-top: 10px;
    }
`;

class ConfirmUnverifiedAddress extends PureComponent<Props> {
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
        const { account, onCancel, showAddress } = this.props;
        if (!account) return;
        onCancel();
        showAddress(account.accountPath);
    }

    showUnverifiedAddress() {
        const { onCancel, showUnverifiedAddress } = this.props;
        onCancel();
        showUnverifiedAddress();
    }

    render() {
        const { device, account, onCancel } = this.props;

        let deviceStatus;
        let claim;

        if (!device.connected) {
            deviceStatus = <FormattedMessage {...l10nMessages.TR_DEVICE_LABEL_IS_NOT_CONNECTED} values={{ deviceLabel: device.label }} />;
            claim = <FormattedMessage {...l10nMessages.TR_PLEASE_CONNECT_YOUR_DEVICE} />;
        } else {
            // corner-case where device is connected but it is unavailable because it was created with different "passphrase_protection" settings
            const enable: boolean = !!(device.features && device.features.passphrase_protection);
            deviceStatus = <FormattedMessage {...l10nMessages.TR_DEVICE_LABEL_IS_UNAVAILABLE} values={{ deviceLabel: device.label }} />;
            claim = enable
                ? <FormattedMessage {...l10nMessages.TR_PLEASE_ENABLE_PASSPHRASE} />
                : <FormattedMessage {...l10nMessages.TR_PLEASE_DISABLE_PASSPHRASE} />;
        }

        return (
            <Wrapper>
                <StyledLink onClick={onCancel}>
                    <Icon size={24} color={colors.TEXT_SECONDARY} icon={icons.CLOSE} />
                </StyledLink>
                <H2>{ deviceStatus }</H2>
                <StyledP isSmaller>
                    <FormattedMessage
                        {...l10nMessages.TR_TO_PREVENT_PHISHING_ATTACKS_COMMA}
                        values={{ claim }}
                    />
                </StyledP>
                <Row>
                    <Button onClick={() => (!account ? this.verifyAddress() : 'false')}><FormattedMessage {...l10nMessages.TR_TRY_AGAIN} /></Button>
                    <Button isWhite onClick={() => this.showUnverifiedAddress()}><FormattedMessage {...l10nMessages.TR_SHOW_UNVERIFIED_ADDRESS} /></Button>
                </Row>
            </Wrapper>
        );
    }
}

ConfirmUnverifiedAddress.propTypes = {
    device: PropTypes.object.isRequired,
    account: PropTypes.object.isRequired,
    showAddress: PropTypes.func.isRequired,
    showUnverifiedAddress: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default ConfirmUnverifiedAddress;