/* @flow */
import React from 'react';
import styled, { css } from 'styled-components';
import { H2 } from 'components/Heading';
import Button from 'components/Button';
import ICONS from 'config/icons';
import colors from 'config/colors';

import Tooltip from 'rc-tooltip';
import { QRCode } from 'react-qr-svg';

import SelectedAccount from 'views/Wallet/components/SelectedAccount';

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
        background: ${colors.WHITE};
        z-index: 10001; /* bigger than modal container */
        border-color: ${colors.GREEN_PRIMARY};
        border-width: 2px;
        transform: translate(-1px, -1px);
    `};
`;

const AddressInfoText = styled.div`
    display: block;
    position: relative;
    background: ${colors.WHITE};
    z-index: 10001;
    width: 100%;
    padding: 6px 12px;
    transform: translate(-1px, -1px);
    margin: 0px 2px;
`;

const StyledButton = styled(Button)`
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
`;

const EyeButton = styled(Button)`
    z-index: 10001;
    padding: 0;
    position: absolute;
    left: auto;
    right: 40px;
    top: 2px;
`;

const qrCodeStyle = {
    width: 256,
    margin: '20px auto',
};

const TooltipContentWrapper = styled.div``;

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
        <SelectedAccount {...props}>
            <Wrapper>
                <StyledH2>Receive Ethereum or tokens</StyledH2>
                <AddressWrapper>
                    {isAddressVerifying && (
                        <AddressInfoText>Confirm address on TREZOR</AddressInfoText>
                    )}
                    {((addressVerified || addressUnverified) && !isAddressVerifying) && (
                        <Tooltip
                            arrowContent={<div className="rc-tooltip-arrow-inner" />}
                            placement="bottomRight"
                            overlay={(
                                <TooltipContentWrapper>
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
                                </TooltipContentWrapper>
                            )}
                        >
                            <EyeButton
                                isTransparent
                                onClick={() => props.showAddress(account.addressPath)}
                                icon={{
                                    type: addressUnverified ? ICONS.EYE_CROSSED : ICONS.EYE,
                                    color: addressUnverified ? colors.ERROR_PRIMARY : colors.TEXT_PRIMARY,
                                }}
                            />
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
                            className="qr"
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                            level="Q"
                            style={qrCodeStyle}
                            value={account.address}
                        />
                    )}
                    {!(addressVerified || addressUnverified) && (
                        <StyledButton
                            onClick={() => props.showAddress(account.addressPath)}
                            isDisabled={device.connected && !discovery.completed}
                            icon={{
                                type: ICONS.EYE,
                                color: colors.WHITE,
                                size: 25,
                            }}
                        >Show full address
                        </StyledButton>
                    )}
                </AddressWrapper>
            </Wrapper>
        </SelectedAccount>
    );
};

export default AccountReceive;
