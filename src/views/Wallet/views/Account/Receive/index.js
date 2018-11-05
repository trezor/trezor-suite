/* @flow */
import React from 'react';
import { QRCode } from 'react-qr-svg';
import styled from 'styled-components';
import media from 'styled-media-query';

import { H2 } from 'components/Heading';
import Button from 'components/Button';
import Icon from 'components/Icon';
import Tooltip from 'components/Tooltip';
import Input from 'components/inputs/Input';

import ICONS from 'config/icons';
import colors from 'config/colors';
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

const ShowAddressButton = styled(Button)`
    min-width: 195px;
    padding: 0;
    white-space: nowrap;
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

    &:hover {
        background: white;
    }
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
        notification,
    } = props.selectedAccount;
    const { type, title, message } = notification;
    if (!device || !account || !discovery || !shouldRender) return <Content type={type} title={title} message={message} isLoading />;

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
                            readOnly
                            value={address}
                            isPartiallyHidden={isAddressHidden}
                            trezorAction={isAddressVerifying ? (
                                <React.Fragment>
                                    <Icon
                                        icon={ICONS.T1}
                                        color={colors.WHITE}
                                    />
                                    Check address on your Trezor
                                </React.Fragment>
                            ) : null}
                            icon={((addressVerified || addressUnverified) && !isAddressVerifying) && (
                                <Tooltip
                                    placement="left"
                                    content={(
                                        <VerifyAddressTooltip
                                            isConnected={device.connected}
                                            isAvailable={device.available}
                                            addressUnverified={addressUnverified}
                                        />
                                    )}
                                >
                                    <EyeButton onClick={() => props.showAddress(account.addressPath)}>
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
                    {(addressVerified || addressUnverified) && !isAddressVerifying && (
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
