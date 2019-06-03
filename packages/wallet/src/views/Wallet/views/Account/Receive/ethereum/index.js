/* @flow */
import React from 'react';
import { QRCode } from 'react-qr-svg';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { Button, Icon, Tooltip, Input, colors, icons as ICONS } from 'trezor-ui-components';
import Title from 'views/Wallet/components/Title';
import DeviceIcon from 'components/images/DeviceIcon';
import Content from 'views/Wallet/components/Content';
import { CONTEXT_DEVICE } from 'actions/constants/modal';
import l10nCommonMessages from 'views/common.messages';
import VerifyAddressTooltip from '../components/VerifyAddressTooltip';
import l10nMessages from './index.messages';
import l10nReceiveMessages from '../common.messages';

import type { Props } from './Container';

const Label = styled.div`
    padding-bottom: 10px;
    color: ${colors.TEXT_SECONDARY};
`;

const AddressWrapper = styled.div`
    display: flex;
    flex-wrap: wrap;
    flex-direction: row;
`;

const StyledQRCode = styled(QRCode)`
    padding: 15px;
    margin-top: 0 25px;
    border: 1px solid ${colors.BODY};
`;

const ShowAddressButton = styled(Button)`
    white-space: nowrap;
    display: flex;
    height: 40px;
    align-items: center;
    align-self: flex-end;
    justify-content: center;

    border-top-left-radius: 0;
    border-bottom-left-radius: 0;

    @media screen and (max-width: 795px) {
        margin-top: 10px;
        align-self: auto;
        border-radius: 3px;
    }
`;

const EyeButton = styled(Button)`
    z-index: 10001;
    padding: 0;
    top: 10px;
    position: absolute;
    right: 10px;

    &:hover {
        background: transparent;
    }
`;

const Row = styled.div`
    display: flex;
    width: 100%;
    padding-bottom: 28px;

    @media screen and (max-width: 795px) {
        flex-direction: column;
    }
`;

const QrWrapper = styled.div`
    display: flex;
    flex-direction: column;
`;

const StyledDeviceIcon = styled(DeviceIcon)`
    margin-right: 6px;
`;

const AccountReceive = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const { account, discovery, shouldRender } = props.selectedAccount;

    if (!device || !account || !discovery || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return <Content loader={loader} exceptionPage={exceptionPage} isLoading />;
    }

    const { addressVerified, addressUnverified } = props.receive;

    const isAddressVerifying =
        props.modal.context === CONTEXT_DEVICE &&
        props.modal.windowType === 'ButtonRequest_Address';
    const isAddressHidden =
        !isAddressVerifying && !addressVerified && !addressUnverified && !account.imported;

    let address = `${account.descriptor.substring(0, 20)}...`;
    if (addressVerified || addressUnverified || isAddressVerifying || account.imported) {
        address = account.descriptor;
    }

    return (
        <Content>
            <React.Fragment>
                <Title>
                    <FormattedMessage {...l10nMessages.TR_RECEIVE_ETHEREUM_OR_TOKENS} />
                </Title>
                <AddressWrapper isShowingQrCode={addressVerified || addressUnverified}>
                    <Row>
                        <Input
                            type="text"
                            readOnly
                            topLabel={props.intl.formatMessage(l10nCommonMessages.TR_ADDRESS)}
                            value={address}
                            isPartiallyHidden={isAddressHidden}
                            tooltipAction={
                                isAddressVerifying ? (
                                    <React.Fragment>
                                        <StyledDeviceIcon
                                            size={16}
                                            device={device}
                                            color={colors.WHITE}
                                        />
                                        <FormattedMessage
                                            {...l10nReceiveMessages.TR_CHECK_ADDRESS_ON_TREZOR}
                                        />
                                    </React.Fragment>
                                ) : null
                            }
                            icon={
                                (addressVerified || addressUnverified) &&
                                !isAddressVerifying && (
                                    <EyeButton
                                        isTransparent
                                        onClick={() => props.showAddress(account.accountPath)}
                                    >
                                        <Tooltip
                                            placement="top"
                                            content={
                                                <VerifyAddressTooltip
                                                    isConnected={device.connected}
                                                    isAvailable={device.available}
                                                    addressUnverified={addressUnverified}
                                                />
                                            }
                                        >
                                            <Icon
                                                size={16}
                                                icon={
                                                    addressUnverified
                                                        ? ICONS.EYE_CROSSED
                                                        : ICONS.EYE
                                                }
                                                color={
                                                    addressUnverified
                                                        ? colors.ERROR_PRIMARY
                                                        : colors.TEXT_PRIMARY
                                                }
                                            />
                                        </Tooltip>
                                    </EyeButton>
                                )
                            }
                        />
                        {!(addressVerified || addressUnverified) && !account.imported && (
                            <ShowAddressButton
                                icon={ICONS.EYE}
                                onClick={() => props.showAddress(account.accountPath)}
                                isDisabled={device.connected && !discovery.completed}
                            >
                                <FormattedMessage {...l10nReceiveMessages.TR_SHOW_FULL_ADDRESS} />
                            </ShowAddressButton>
                        )}
                    </Row>
                    {(((addressVerified || addressUnverified) && !isAddressVerifying) ||
                        account.imported) && (
                        <QrWrapper>
                            <Label>
                                <FormattedMessage {...l10nReceiveMessages.TR_QR_CODE} />
                            </Label>
                            <StyledQRCode
                                bgColor="#FFFFFF"
                                fgColor="#000000"
                                level="Q"
                                style={{ width: 150 }}
                                value={account.descriptor}
                            />
                        </QrWrapper>
                    )}
                </AddressWrapper>
            </React.Fragment>
        </Content>
    );
};

export default AccountReceive;
