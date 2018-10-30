/* @flow */
import React from 'react';
import { QRCode } from 'react-qr-svg';
import styled, { css } from 'styled-components';
import media from 'styled-media-query';

import { H2 } from 'components/Heading';
import Button from 'components/Button';
import Icon from 'components/Icon';
import Tooltip from 'components/Tooltip';
import Input from 'components/inputs/Input';

import ICONS from 'config/icons';
import colors from 'config/colors';
import { FONT_SIZE, FONT_WEIGHT, FONT_FAMILY } from 'config/variables';
import { CONTEXT_DEVICE } from 'actions/constants/modal';

import Content from 'views/Wallet/components/Content';
import VerifyAddressTooltip from './components/VerifyAddressTooltip';

import type { Props } from './Container';

const Label = styled.div`
    padding: 25px 0 5px 0;
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

const StyledInput = styled.div`

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
    top: 35px;
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
    top: 45px;
    background: black;
    color: ${colors.WHITE};
    border-radius: 5px;
    line-height: 37px;
    z-index: 10001;
    transform: translate(-1px, -1px);
`;

const ShowAddressButton = styled(Button)`
    min-width: 195px;
    padding: 0;
    display: flex;
    height: 40px;
    align-items: center;
    justify-content: center;

    border-top-left-radius: 0;
    border-bottom-left-radius: 0;

    ${media.lessThan('795px')`
        margin-top: 10px;
    `}
`;

const ShowAddressIcon = styled(Icon)`
    margin-right: 7px;
    position: relative;
    top: 2px;
`;

const EyeButton = styled(Button)`
    z-index: 10001;
    padding: 0;
    width: 30px;
    background: white;
    top: 5px;
    position: absolute;
    right: 10px;
`;

const Row = styled.div`
    display: flex;
    width: 100%;

    ${media.lessThan('795px')`
        flex-direction: column;
    `}
`;

const QrWrapper = styled.div`
    display: flex;
    flex-direction: column;
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

    const isAddressVerifying = props.modal.context === CONTEXT_DEVICE && props.modal.windowType === 'ButtonRequest_Address';
    const isAddressHidden = !isAddressVerifying && !addressVerified && !addressUnverified;

    let address = `${account.address.substring(0, 20)}...`;
    if (addressVerified || addressUnverified || isAddressVerifying) {
        ({ address } = account);
    }

    return (
        <Content>
            <React.Fragment>
                <H2>Receive Ethereum or tokens</H2>
                <AddressWrapper isShowingQrCode={addressVerified || addressUnverified}>
                    <Label>Address</Label>
                    <Row>
                        <Input
                            type="text"
                            value={address}
                            isPartiallyHidden={isAddressHidden}
                            trezorAction={(
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
                            icon={((addressVerified || addressUnverified) && !isAddressVerifying) && (
                                <Tooltip
                                    placement="bottom"
                                    content={(
                                        <VerifyAddressTooltip
                                            isConnected={device.connected}
                                            isAvailable={device.available}
                                            addressUnverified={addressUnverified}
                                        />
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
                        />
                        {!(addressVerified || addressUnverified) && (
                            <ShowAddressButton onClick={() => props.showAddress(account.addressPath)} isDisabled={device.connected && !discovery.completed}>
                                <ShowAddressIcon icon={ICONS.EYE} color={colors.WHITE} />Show full address
                            </ShowAddressButton>
                        )}
                    </Row>
                    {(addressVerified || addressUnverified) && (
                        <QrWrapper>
                            <Label>QR code</Label>
                            <StyledQRCode
                                bgColor="#FFFFFF"
                                fgColor="#000000"
                                level="Q"
                                style={{ width: 150 }}
                                value={account.address}
                            />
                        </QrWrapper>
                    )}
                </AddressWrapper>
            </React.Fragment>
        </Content>
    );
};

export default AccountReceive;
