import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import Title from '@wallet-components/Title';
import { FormattedMessage } from 'react-intl';

import QrCode from '@wallet-components/QrCode';
import AddressList from '@suite/components/wallet/AddressList';
import { H6, variables, Button, colors, Icon, Link } from '@trezor/components';
import AddressItem from '@suite/components/wallet/AddressItem';
import { selectText } from '@suite/utils/suite/dom';
import ShowOnTrezorEyeButton from '@suite/components/wallet/ShowOnTrezorEyeButton';
import SETTINGS from '@suite-config/settings';
import { parseBIP44Path } from '@suite/utils/wallet/accountUtils';
import { AccountAddresses } from 'trezor-connect';
import messages from './messages';
import { ReceiveProps } from '../index';
import { DeviceIcon } from '@suite-components';

const Wrapper = styled.div``;

// const SubHeading = styled(H6)`
//     font-weight: ${variables.FONT_WEIGHT.MEDIUM};
// `;

const SmallButton = styled(Button)`
    padding: 8px 16px;
`;

const AddFreshAddress = styled(SmallButton)``;

const ButtonsWrapper = styled.div`
    display: flex;
    margin-top: 16px;
    /* justify-content: flex-end; */
`;

const FreshAddress = styled(AddressItem)`
    border: 1px solid #ccc;
    padding-top: 2px;
    padding-bottom: 2px;
    border-radius: 3px;
    height: 47px;
`;

const ShowAddressButton = styled(SmallButton)`
    flex: 1 0 0;
    white-space: nowrap;
    display: flex;
    align-items: center;
    align-self: flex-end;
    justify-content: center;

    /* border-top-left-radius: 0;
    border-bottom-left-radius: 0; */

    /* @media screen and (max-width: 795px) {
        width: 100%;
        margin-top: 10px;
        align-self: auto;
        border-radius: 3px;
    } */
`;

const SubHeading = styled(H6)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    padding: 0;
`;

const ControlsLink = styled(Link)`
    display: flex;
    text-decoration: none;
    align-items: center;

    &:hover {
        text-decoration: none;
    }

    & + & {
        margin-left: 24px;
    }
`;

const ControlsLinkIcon = styled(Icon)`
    margin-right: 6px;
`;

const ControlsWrapper = styled.div`
    display: flex;
    margin-left: auto;
`;

const TitleWrapper = styled.div`
    display: flex;
    /* padding: 4px; */
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 10px;
`;

const FreshAddressList = styled(AddressList)`
    margin-top: 16px;
`;

const PreviousAddressList = styled(AddressList)`
    margin-bottom: 16px;
`;

const TextGreen = styled.span`
    color: ${colors.GREEN_PRIMARY};
`;

const StyledDeviceIcon = styled(DeviceIcon)`
    margin-right: 6px;
`;

type Addresses = AccountAddresses['used'] | AccountAddresses['unused'];
type Address = Addresses[number];

const BitcoinReceive = ({ className, ...props }: ReceiveProps) => {
    const firstFreshAddrRef = useRef<HTMLDivElement>(null);

    const { addresses } = props.account;
    const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);
    const [freshAddrCount, setFreshAddrCount] = useState(0);

    useEffect(() => {
        // reset selected addr, showed fresh addresses on account change
        setSelectedAddr(null);
        setFreshAddrCount(0);
    }, [props.account]);

    if (!addresses) return null;

    const firstFreshAddress = addresses.unused[0];
    // <FormattedMessage {...messages.TR_CHECK_ADDRESS_ON_TREZOR} />
    const tooltipAction = (addr: Address) => {
        return props.isAddressVerifying && selectedAddr && selectedAddr.address === addr.address ? (
            <>
                <StyledDeviceIcon size={16} device={props.device} color={colors.WHITE} />
                <div>CHeck addr on trezor'</div>
            </>
        ) : null;
    };

    return (
        <Wrapper key={props.account.descriptor}>
            <Title>
                <FormattedMessage {...messages.TR_RECEIVE_BITCOIN} />
            </Title>

            <PreviousAddressList
                addresses={addresses.used}
                setSelectedAddr={setSelectedAddr}
                selectedAddress={selectedAddr}
                paginationEnabled
                secondaryText={_addr => (
                    <>
                        Total received: <TextGreen>x BTC</TextGreen>
                    </>
                )}
                tooltipActions={tooltipAction}
                actions={addr => (
                    <ShowOnTrezorEyeButton
                        device={props.device}
                        isAddressUnverified={props.isAddressUnverified}
                        onClick={() => {
                            setSelectedAddr(addr);
                            props.showAddress(addr.path);
                        }}
                    />
                )}
                controls={(page, setPage, isCollapsed, setIsCollapsed, moreItems) => (
                    <TitleWrapper>
                        {!isCollapsed && <SubHeading>Previous addresses</SubHeading>}

                        <ControlsWrapper>
                            {!isCollapsed && (
                                <ControlsLink
                                    onClick={() => {
                                        setPage(-1);
                                        setIsCollapsed(true);
                                    }}
                                >
                                    <ControlsLinkIcon
                                        size={12}
                                        color={colors.GREEN_PRIMARY}
                                        icon="ARROW_DOWN"
                                    />
                                    Hide previous addresses
                                </ControlsLink>
                            )}
                            {(moreItems || isCollapsed) && (
                                <ControlsLink
                                    onClick={() => {
                                        setPage(page + 1);
                                        setIsCollapsed(false);
                                    }}
                                >
                                    <ControlsLinkIcon
                                        size={12}
                                        color={colors.GREEN_PRIMARY}
                                        icon="ARROW_UP"
                                    />
                                    Show previous addresses
                                </ControlsLink>
                            )}
                        </ControlsWrapper>
                    </TitleWrapper>
                )}
            />

            <TitleWrapper>
                <SubHeading>Fresh address</SubHeading>
            </TitleWrapper>

            <FreshAddress
                key={firstFreshAddress.address}
                ref={firstFreshAddrRef}
                onClick={() => {
                    if (props.isAddressVerified && firstFreshAddrRef.current) {
                        selectText(firstFreshAddrRef.current as HTMLElement);
                    }
                    setSelectedAddr(firstFreshAddress);
                }}
                isSelected={firstFreshAddress === selectedAddr}
                address={firstFreshAddress.address}
                index={parseBIP44Path(firstFreshAddress.path)!.addrIndex}
                isPartiallyHidden={props.isAddressPartiallyHidden}
                isVerifying
                tooltipActions={tooltipAction(firstFreshAddress)}
                readOnly
                actions={
                    <>
                        {!(props.isAddressVerified || props.isAddressUnverified) && ( // !account.imported
                            <ShowAddressButton
                                onClick={() => props.showAddress(firstFreshAddress.path)}
                                // isDisabled={device.connected && !discovery.completed}
                                icon="EYE"
                            >
                                {/* <FormattedMessage {...messages.TR_SHOW_FULL_ADDRESS} /> */}
                                Show full address
                            </ShowAddressButton>
                        )}
                        {(props.isAddressVerified || props.isAddressUnverified) &&
                            !props.isAddressVerifying && (
                                <ShowOnTrezorEyeButton
                                    device={props.device}
                                    isAddressUnverified={props.isAddressUnverified}
                                    onClick={() => props.showAddress(firstFreshAddress.path)}
                                />
                            )}
                    </>
                }
            />

            <ButtonsWrapper>
                <AddFreshAddress
                    isWhite
                    onClick={() => {
                        setFreshAddrCount(freshAddrCount + 1);
                    }}
                    icon="PLUS"
                    isDisabled={freshAddrCount >= SETTINGS.FRESH_ADDRESS_LIMIT + 1}
                >
                    Add fresh address
                </AddFreshAddress>
            </ButtonsWrapper>

            <FreshAddressList
                key={props.account.descriptor}
                addresses={addresses.unused.slice(1, freshAddrCount + 1)}
                setSelectedAddr={setSelectedAddr}
                selectedAddress={selectedAddr}
                paginationEnabled={false}
                collapsed={false}
                tooltipActions={tooltipAction}
                actions={addr => (
                    <>
                        {!(props.isAddressVerified || props.isAddressUnverified) && ( // !account.imported
                            <ShowAddressButton
                                onClick={() => props.showAddress(addr.path)}
                                // isDisabled={device.connected && !discovery.completed}
                                icon="EYE"
                            >
                                {/* <FormattedMessage {...messages.TR_SHOW_FULL_ADDRESS} /> */}
                                Show full address
                            </ShowAddressButton>
                        )}
                        {(props.isAddressVerified || props.isAddressUnverified) &&
                            !props.isAddressVerifying && (
                                <ShowOnTrezorEyeButton
                                    device={props.device}
                                    isAddressUnverified={props.isAddressUnverified}
                                    onClick={() => props.showAddress(addr.path)}
                                />
                            )}
                    </>
                )}
            />
            {/* <VerifyAddressInput
                device={props.device}
                accountPath={addresses.unused[0].path}
                accountAddress={addresses.unused[0].address}
                isAddressHidden={props.isAddressHidden}
                isAddressVerified={props.isAddressVerified}
                isAddressUnverified={props.isAddressUnverified}
                isAddressVerifying={props.isAddressVerifying}
                showAddress={props.showAddress}
            /> */}
            {(props.isAddressVerified || props.isAddressUnverified) &&
                !props.isAddressVerifying && (
                    <QrCode
                        value={addresses ? addresses.unused[0].address : props.account.descriptor}
                        accountPath={addresses ? addresses.unused[0].path : props.account.path}
                    />
                )}
        </Wrapper>
    );
};

export default BitcoinReceive;
