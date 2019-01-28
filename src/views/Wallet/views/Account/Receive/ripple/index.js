/* @flow */
import React from 'react';
import { QRCode } from 'react-qr-svg';
import styled from 'styled-components';

import Title from 'views/Wallet/components/Title';
import Button from 'components/Button';
import Icon from 'components/Icon';
import Tooltip from 'components/Tooltip';
import Input from 'components/inputs/Input';
import DeviceIcon from 'components/images/DeviceIcon';

import ICONS from 'config/icons';
import colors from 'config/colors';
import { CONTEXT_DEVICE } from 'actions/constants/modal';

import Content from 'views/Wallet/components/Content';
import VerifyAddressTooltip from '../components/VerifyAddressTooltip';

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
    min-width: 195px;
    padding: 0;
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

const ShowAddressIcon = styled(Icon)`
    margin-right: 7px;
    position: relative;
    top: 2px;
`;

const EyeButton = styled(Button)`
    z-index: 10001;
    padding: 0;
    width: 30px;
    background: transparent;
    top: 5px;
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

const AccountReceive = (props: Props) => {
    const device = props.wallet.selectedDevice;
    const {
        account,
        discovery,
        shouldRender,
    } = props.selectedAccount;

    if (!device || !account || !discovery || !shouldRender) {
        const { loader, exceptionPage } = props.selectedAccount;
        return <Content loader={loader} exceptionPage={exceptionPage} isLoading />;
    }

    const {
        addressVerified,
        addressUnverified,
    } = props.receive;

    const isAddressVerifying = props.modal.context === CONTEXT_DEVICE && props.modal.windowType === 'ButtonRequest_Address';
    const isAddressHidden = !isAddressVerifying && !addressVerified && !addressUnverified;

    let address = `${account.descriptor.substring(0, 20)}...`;
    if (addressVerified || addressUnverified || isAddressVerifying) {
        address = account.descriptor;
    }

    return (
        <Content>
            <React.Fragment>
                <Title>Receive Ripple</Title>
                <AddressWrapper isShowingQrCode={addressVerified || addressUnverified}>
                    <Row>
                        <Input
                            type="text"
                            readOnly
                            autoSelect
                            topLabel="Address"
                            value={address}
                            isPartiallyHidden={isAddressHidden}
                            trezorAction={isAddressVerifying ? (
                                <React.Fragment>
                                    <DeviceIcon device={device} color={colors.WHITE} />
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
                                    <EyeButton onClick={() => props.showAddress(account.accountPath)}>
                                        <Icon
                                            icon={addressUnverified ? ICONS.EYE_CROSSED : ICONS.EYE}
                                            color={addressUnverified ? colors.ERROR_PRIMARY : colors.TEXT_PRIMARY}
                                        />
                                    </EyeButton>
                                </Tooltip>
                            )}
                        />
                        {!(addressVerified || addressUnverified) && (
                            <ShowAddressButton onClick={() => props.showAddress(account.accountPath)} isDisabled={device.connected && !discovery.completed}>
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