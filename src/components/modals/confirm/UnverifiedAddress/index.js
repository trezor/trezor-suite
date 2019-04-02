/* @flow */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { getOldWalletUrl } from 'utils/url';
import { FormattedMessage } from 'react-intl';
import { Link, Button, Icon, P, H5, colors, icons } from 'trezor-ui-components';

import type { TrezorDevice } from 'flowtype';
import l10nCommonMessages from 'views/common.messages';
import l10nMessages from './index.messages';

import type { Props as BaseProps } from '../../Container';

type Props = {
    device: TrezorDevice,
    account: $ElementType<$ElementType<BaseProps, 'selectedAccount'>, 'account'>,
    showAddress: $ElementType<$ElementType<BaseProps, 'receiveActions'>, 'showAddress'>,
    showUnverifiedAddress: $ElementType<
        $ElementType<BaseProps, 'receiveActions'>,
        'showUnverifiedAddress'
    >,
    onCancel: $ElementType<$ElementType<BaseProps, 'modalActions'>, 'onCancel'>,
};

const StyledLink = styled(Link)`
    position: absolute;
    right: 15px;
    top: 15px;
`;

const Wrapper = styled.div`
    max-width: 370px;
    padding: 30px 0px;
`;

const Content = styled.div`
    padding: 0px 48px;
`;

const StyledP = styled(P)`
    && {
        padding-bottom: 20px;
    }
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background: ${colors.DIVIDER};
    margin: 20px 0px;
`;

const Row = styled.div`
    display: flex;
    flex-direction: column;

    button + button {
        margin-top: 10px;
    }
`;

const BackupButton = styled(Button)`
    width: 100%;
`;

const WarnButton = styled(Button)`
    background: transparent;
    border-color: ${colors.WARNING_PRIMARY};
    color: ${colors.WARNING_PRIMARY};

    &:focus,
    &:hover,
    &:active {
        color: ${colors.WHITE};
        background: ${colors.WARNING_PRIMARY};
        box-shadow: none;
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
            deviceStatus = (
                <FormattedMessage
                    {...l10nMessages.TR_DEVICE_LABEL_IS_NOT_CONNECTED}
                    values={{ deviceLabel: device.label }}
                />
            );
            claim = <FormattedMessage {...l10nMessages.TR_PLEASE_CONNECT_YOUR_DEVICE} />;
        } else {
            // corner-case where device is connected but it is unavailable because it was created with different "passphrase_protection" settings
            const enable: boolean = !!(device.features && device.features.passphrase_protection);
            deviceStatus = (
                <FormattedMessage
                    {...l10nMessages.TR_DEVICE_LABEL_IS_UNAVAILABLE}
                    values={{ deviceLabel: device.label }}
                />
            );
            claim = enable ? (
                <FormattedMessage {...l10nMessages.TR_PLEASE_ENABLE_PASSPHRASE} />
            ) : (
                <FormattedMessage {...l10nMessages.TR_PLEASE_DISABLE_PASSPHRASE} />
            );
        }

        const needsBackup = device.features && device.features.needs_backup;

        return (
            <Wrapper>
                <Content>
                    <StyledLink onClick={onCancel}>
                        <Icon size={12} color={colors.TEXT_SECONDARY} icon={icons.CLOSE} />
                    </StyledLink>
                    <H5>{deviceStatus}</H5>
                    <StyledP size="small">
                        <FormattedMessage
                            {...l10nMessages.TR_TO_PREVENT_PHISHING_ATTACKS_COMMA}
                            values={{ claim }}
                        />
                    </StyledP>
                </Content>
                <Content>
                    <Row>
                        <Button onClick={() => (!account ? this.verifyAddress() : 'false')}>
                            <FormattedMessage {...l10nMessages.TR_TRY_AGAIN} />
                        </Button>
                        <WarnButton isWhite onClick={() => this.showUnverifiedAddress()}>
                            <FormattedMessage {...l10nMessages.TR_SHOW_UNVERIFIED_ADDRESS} />
                        </WarnButton>
                    </Row>
                </Content>
                {needsBackup && <Divider />}
                {needsBackup && (
                    <>
                        <Content>
                            <H5>
                                <FormattedMessage
                                    {...l10nMessages.TR_DEVICE_LABEL_IS_NOT_BACKED_UP}
                                    values={{ deviceLabel: device.label }}
                                />
                            </H5>
                            <StyledP size="small">
                                <FormattedMessage
                                    {...l10nCommonMessages.TR_IF_YOUR_DEVICE_IS_EVER_LOST}
                                />
                            </StyledP>
                        </Content>
                        <Content>
                            <Row>
                                <Link href={`${getOldWalletUrl(device)}/?backup`}>
                                    <BackupButton>
                                        <FormattedMessage
                                            {...l10nCommonMessages.TR_CREATE_BACKUP_IN_3_MINUTES}
                                        />
                                    </BackupButton>
                                </Link>
                            </Row>
                        </Content>
                    </>
                )}
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
