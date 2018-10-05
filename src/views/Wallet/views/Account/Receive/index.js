/* @flow */
import React from 'react';
import styled, { css } from 'styled-components';
import { H2 } from 'components/Heading';
import Button from 'components/Button';
import Icon from 'components/Icon';
import ICONS from 'config/icons';
import Content from 'views/Wallet/components/Content';
import colors from 'config/colors';

import Tooltip from 'components/Tooltip';
import { QRCode } from 'react-qr-svg';

import { FONT_SIZE, FONT_WEIGHT, FONT_FAMILY } from 'config/variables';
import VerifyAddressTooltip from './components/VerifyAddressTooltip';

import type { Props } from './Container';

const Label = styled.div`
    padding: 25px 0 5px 0;
    color: ${colors.TEXT_SECONDARY};
`;

const AddressWrapper = styled.div`
    position: relative;
    display: flex;
    margin-top: 20px;
    flex-wrap: wrap;
    flex-direction: ${props => (props.isShowingQrCode ? 'column' : 'row')};
`;

const StyledQRCode = styled(QRCode)`
    padding: 15px;
    margin-top: 0 25px;
    border: 1px solid ${colors.BODY};
`;

const ValueWrapper = styled.div`
    font-size: ${FONT_SIZE.SMALL};
    height: 40px;
    font-weight: ${FONT_WEIGHT.SMALLEST};
    line-height: 1.42857143;
    font-family: ${FONT_FAMILY.MONOSPACE};
    color: ${colors.TEXT_PRIMARY};
    border: 1px solid ${colors.DIVIDER};
    border-radius: 3px;
    padding: 10px 12px;
    padding-right: 38px;
    position: relative;
    flex: 1;
    user-select: all;

    ${props => props.isHidden && css`
        padding-right: 6px;
        user-select: none;
        border-radius: 3px 0px 0px 3px;
        &:after {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: 100%;
            background: linear-gradient(to right,
                rgba(255,255,255, 0) 0%,
                rgba(255,255,255, 1) 220px
            );
            pointer-events: none; /* so the text is still selectable */
        }
    `};

    ${props => props.isVerifying && css`
        z-index: 10001; /* bigger than modal container */
        border-color: ${colors.WHITE};
        border-width: 2px;
        transform: translate(-1px, -1px);
        background: ${colors.DIVIDER};
    `};
`;

const ArrowUp = styled.div`
    position: absolute;
    top: 30px;
    left: 70px;
    width: 0;
    height: 0;
    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-bottom: 9px solid black;
    z-index: 10001;
`;

const AddressInfoText = styled.div`
    display: flex;
    align-items: center;
    height: 37px;
    margin: 0px 2px;
    padding: 0 14px 0 5px;
    position: absolute;
    top: 39px;
    background: black;
    color: ${colors.WHITE};
    border-radius: 5px;
    line-height: 37px;
    z-index: 10001;
    transform: translate(-1px, -1px);
`;

const ShowAddressButton = styled(Button)`
    padding-top: 0;
    padding-bottom: 0;
    padding-left: 10px;

    display: flex;
    align-items: center;

    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
`;

const ShowAddressIcon = styled(Icon)`
    margin-right: 7px;
    position: relative;
    top: 2px;
`;

const EyeButton = styled(Button)`
    z-index: 10001;
    padding: 0;
    position: absolute;
    left: auto;
    right: 10px;
    top: 6px;
`;

const AccountReceive = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const {
        account,
        discovery,
        shouldRender,
    } = props.selectedAccount;

    if (!device || !account || !discovery || !shouldRender) return null;

    const {
        addressVerified,
        addressUnverified,
    } = props.receive;

    let address = `${account.address.substring(0, 20)}...`;
    if (addressVerified
        || addressUnverified
        || (props.modal.opened && props.modal.windowType === 'ButtonRequest_Address')) {
        ({ address } = account);
    }
    const isAddressVerifying = props.modal.opened && props.modal.windowType === 'ButtonRequest_Address';
    const isAddressHidden = !isAddressVerifying && !addressVerified && !addressUnverified;

    return (
        <Content>
            <React.Fragment>
                <H2>Receive Ethereum or tokens</H2>
                <AddressWrapper
                    isShowingQrCode={addressVerified || addressUnverified}
                >
                    {isAddressVerifying && (
                        <AddressInfoText>Confirm address on TREZOR</AddressInfoText>
                    )}
                    {((addressVerified || addressUnverified) && !isAddressVerifying) && (

                        <EyeButton
                            isTransparent
                            onClick={() => props.showAddress(account.addressPath)}
                        >
                            <Tooltip
                                placement="bottomRight"
                                content={(
                                    <VerifyAddressTooltip
                                        isConnected={device.connected}
                                        isAvailable={device.available}
                                        addressUnverified={addressUnverified}
                                    />
                                )}
                            >
                                <Icon
                                    icon={addressUnverified ? ICONS.EYE_CROSSED : ICONS.EYE}
                                    color={addressUnverified ? colors.ERROR_PRIMARY : colors.TEXT_PRIMARY}
                                />
                            </Tooltip>
                        </EyeButton>
                    )}
                    <ValueWrapper
                        isHidden={isAddressHidden}
                        isVerifying={isAddressVerifying}
                    >
                        {address}
                    </ValueWrapper>
                    {isAddressVerifying && (
                        <React.Fragment>
                            <ArrowUp />
                            <AddressInfoText>
                                <Icon
                                    icon={ICONS.T1}
                                    color={colors.WHITE}
                                />
                                Check address on your Trezor
                            </AddressInfoText>
                        </React.Fragment>
                    )}
                    {(addressVerified || addressUnverified) && (
                        <React.Fragment>
                            <Label>QR code</Label>
                            <StyledQRCode
                                bgColor="#FFFFFF"
                                fgColor="#000000"
                                level="Q"
                                style={{ width: 150 }}
                                value={account.address}
                            />
                        </React.Fragment>
                    )}
                    {!(addressVerified || addressUnverified) && (
                        <ShowAddressButton
                            onClick={() => props.showAddress(account.addressPath)}
                            isDisabled={device.connected && !discovery.completed}
                        >
                            <ShowAddressIcon
                                icon={ICONS.EYE}
                                color={colors.WHITE}
                            />
                        Show full address
                        </ShowAddressButton>
                    )}
                </AddressWrapper>
            </React.Fragment>
        </Content>
    );
};

export default AccountReceive;
