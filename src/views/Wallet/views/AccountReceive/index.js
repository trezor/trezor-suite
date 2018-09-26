/* @flow */
import React from 'react';
import styled, { css } from 'styled-components';
import { H2 } from 'components/Heading';
import Button from 'components/Button';
import Icon from 'components/Icon';
import ICONS from 'config/icons';
import colors from 'config/colors';

import Tooltip from 'components/Tooltip';
import { QRCode } from 'react-qr-svg';

import { FONT_SIZE, FONT_WEIGHT, FONT_FAMILY } from 'config/variables';

import type { Props } from './Container';

const Wrapper = styled.div``;
const StyledH2 = styled(H2)`
    padding: 20px 48px;
`;
const AddressWrapper = styled.div`
    position: relative;
    padding: 0px 48px;
    display: flex;
    flex-wrap: wrap;
    flex-direction: ${props => (props.isShowingQrCode ? 'column' : 'row')};
`;

const ValueWrapper = styled.div`
    font-size: ${FONT_SIZE.SMALL};
    font-weight: ${FONT_WEIGHT.SMALLEST};
    line-height: 1.42857143;
    font-family: ${FONT_FAMILY.MONOSPACE};
    color: ${colors.TEXT_PRIMARY};
    border: 1px solid ${colors.DIVIDER};
    border-radius: 3px;
    padding: 6px 12px;
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
    right: 60px;
    top: 3px;
`;

const qrCodeStyle = {
    width: 256,
    margin: '20px auto',
};

const AccountReceive = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const {
        account,
        discovery,
    } = props.selectedAccount;

    if (!device || !account || !discovery) return null;

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
        <Wrapper>
            <StyledH2>Receive Ethereum or tokens</StyledH2>
            <AddressWrapper
                isShowingQrCode={addressVerified || addressUnverified}
            >
                {isAddressVerifying && (
                    <AddressInfoText>Confirm address on TREZOR</AddressInfoText>
                )}
                {((addressVerified || addressUnverified) && !isAddressVerifying) && (
                    <Tooltip
                        placement="bottomRight"
                        content={(
                            <React.Fragment>
                                {addressUnverified ? (
                                    <React.Fragment>
                                        Unverified address.
                                        <br />
                                        {device.connected && device.available ? 'Show on TREZOR' : 'Connect your TREZOR to verify it.'}
                                    </React.Fragment>
                                ) : (
                                    <React.Fragment>
                                        {device.connected ? 'Show on TREZOR' : 'Connect your TREZOR to verify address.'}
                                    </React.Fragment>
                                )}
                            </React.Fragment>
                        )}
                    >
                        <EyeButton
                            isTransparent
                            onClick={() => props.showAddress(account.addressPath)}
                        >
                            <Icon
                                icon={addressUnverified ? ICONS.EYE_CROSSED : ICONS.EYE}
                                color={addressUnverified ? colors.ERROR_PRIMARY : colors.TEXT_PRIMARY}
                            />
                        </EyeButton>
                    </Tooltip>
                )}
                <ValueWrapper
                    isHidden={isAddressHidden}
                    isVerifying={isAddressVerifying}
                >{address}
                </ValueWrapper>
                {isAddressVerifying && (
                    <AddressInfoText>{account.network} account #{account.index + 1}</AddressInfoText>
                )}
                {(addressVerified || addressUnverified) && (
                    <QRCode
                        bgColor="#FFFFFF"
                        fgColor="#000000"
                        level="Q"
                        style={qrCodeStyle}
                        value={account.address}
                    />
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
        </Wrapper>
    );
};

export default AccountReceive;
