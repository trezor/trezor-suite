import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FormattedMessage } from 'react-intl';
import { AccountAddresses } from 'trezor-connect';
import { Button, colors, Icon } from '@trezor/components';
import { P, Link } from '@trezor/components-v2';

import { selectText } from '@suite-utils/dom';
import { parseBIP44Path, formatNetworkAmount } from '@wallet-utils/accountUtils';
import { showAddress } from '@wallet-actions/receiveActions';
import { ReceiveInfo } from '@wallet-reducers/receiveReducer';
import { DeviceIcon } from '@suite-components';
import { SETTINGS } from '@suite-config';
import { AppState } from '@suite-types';
import { Network } from '@wallet-types';
import l10nMessages from './messages';
import QrCode from '../QrCode';
import AddressList from '../AddressList';
import AddressItem from '../AddressItem';
import EyeButton from '../EyeButton';

const Wrapper = styled.div``;

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
    text-transform: uppercase;
`;

const StyledDeviceIcon = styled(DeviceIcon)`
    margin-right: 6px;
`;

type Addresses = AccountAddresses['used'] | AccountAddresses['unused'];
type Address = Addresses[number];

interface Props {
    className?: string;
    // makes all props in selectedAccount required, so the account we need is not optional anymore
    // also excludes null;
    showButtonDisabled: boolean;
    account: Exclude<Required<AppState['wallet']['selectedAccount']>['account'], null>;
    isAddressPartiallyHidden: (descriptor: string) => boolean;
    getAddressReceiveInfo: (descriptor: string) => ReceiveInfo | null;
    showAddress: typeof showAddress;
    networkType: Network['networkType'];
    device: Exclude<AppState['suite']['device'], undefined>;
    title: React.ReactNode;
}

const ReceiveForm = ({ className, ...props }: Props) => {
    const firstFreshAddrRef = useRef<HTMLDivElement>(null);

    const { addresses } = props.account;
    const [selectedAddr, setSelectedAddr] = useState<Address | null>(null);
    const [freshAddrCount, setFreshAddrCount] = useState(0);

    // pick addr from unused addresses in case of bitcoin-like networks otherwise pull info from the props.account (eg. for ethereum/ripple)
    const firstFreshAddress = addresses
        ? addresses.unused[0]
        : {
              address: props.account.descriptor,
              path: props.account.path,
              transfers: props.account.history.total,
          };

    const isAddressUnverified = (descriptor: string) => {
        const addrInfo = props.getAddressReceiveInfo(descriptor);
        return addrInfo ? addrInfo.isAddressUnverified : false;
    };

    const isAddressVerified = (descriptor: string) => {
        const addrInfo = props.getAddressReceiveInfo(descriptor);
        return addrInfo ? addrInfo.isAddressVerified : false;
    };

    const isAddressVerifying = (descriptor: string) => {
        const addrInfo = props.getAddressReceiveInfo(descriptor);
        return addrInfo ? addrInfo.isAddressVerifying : false;
    };

    // tooltipAction components that renders only for the selectedAddress and only if address is being verified
    const tooltipAction = (descriptor: string) => {
        return isAddressVerifying(descriptor) ? (
            <>
                <StyledDeviceIcon size={16} device={props.device} color={colors.WHITE} />
                <FormattedMessage {...l10nMessages.TR_CHECK_ADDRESS_ON_TREZOR} />
            </>
        ) : null;
    };

    useEffect(() => {
        // reset selected address and fresh addresses count on account change
        setSelectedAddr(null);
        setFreshAddrCount(0);
    }, [props.account]);

    return (
        <Wrapper key={props.account.descriptor}>
            {props.title}

            {/* TODO: remove ugly check for addresses and keep typescript happy */}
            {props.networkType === 'bitcoin' && addresses && (
                <PreviousAddressList
                    addresses={addresses.used}
                    setSelectedAddr={setSelectedAddr}
                    selectedAddress={selectedAddr}
                    paginationEnabled
                    isAddressVerifying={isAddressVerifying}
                    secondaryText={addr => (
                        <>
                            <FormattedMessage
                                {...l10nMessages.TR_TOTAL_RECEIVED}
                                values={{
                                    amount: (
                                        <TextGreen>
                                            {formatNetworkAmount(
                                                addr.received || '0',
                                                props.account.symbol,
                                            )}{' '}
                                            {props.account.symbol}
                                        </TextGreen>
                                    ),
                                }}
                            />
                        </>
                    )}
                    tooltipActions={tooltipAction}
                    actions={addr => (
                        <EyeButton
                            isDisabled={props.showButtonDisabled}
                            device={props.device}
                            isAddressUnverified={isAddressUnverified(addr.path)}
                            onClick={() => {
                                setSelectedAddr(addr);
                                props.showAddress(addr.path);
                            }}
                        />
                    )}
                    controls={(page, setPage, isCollapsed, setIsCollapsed, moreItems) => (
                        <TitleWrapper>
                            {!isCollapsed && (
                                <P weight="bold">
                                    <FormattedMessage {...l10nMessages.TR_PREVIOUS_ADDRESSES} />
                                </P>
                            )}

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
                                        <FormattedMessage
                                            {...l10nMessages.TR_HIDE_PREVIOUS_ADDRESSES}
                                        />
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
                                        <FormattedMessage
                                            {...l10nMessages.TR_SHOW_PREVIOUS_ADDRESSES}
                                        />
                                    </ControlsLink>
                                )}
                            </ControlsWrapper>
                        </TitleWrapper>
                    )}
                />
            )}

            <TitleWrapper>
                <P weight="bold">
                    <FormattedMessage {...l10nMessages.TR_FRESH_ADDRESS} />
                </P>
            </TitleWrapper>

            <FreshAddress
                key={firstFreshAddress.address}
                ref={firstFreshAddrRef}
                onClick={() => {
                    if (isAddressVerified(firstFreshAddress.path) && firstFreshAddrRef.current) {
                        selectText(firstFreshAddrRef.current as HTMLElement);
                    }
                    setSelectedAddr(firstFreshAddress);
                }}
                isSelected={addresses ? firstFreshAddress === selectedAddr : true}
                address={firstFreshAddress.address}
                index={parseBIP44Path(firstFreshAddress.path)!.addrIndex}
                isPartiallyHidden={props.isAddressPartiallyHidden(firstFreshAddress.path)}
                tooltipActions={tooltipAction(firstFreshAddress.path)}
                readOnly
                isVerifying={isAddressVerifying(firstFreshAddress.path)}
                actions={
                    <>
                        {!isAddressVerified(firstFreshAddress.path) &&
                        !isAddressUnverified(firstFreshAddress.path) &&
                        !isAddressVerifying(firstFreshAddress.path) && ( // !account.imported
                                <ShowAddressButton
                                    isDisabled={props.showButtonDisabled}
                                    onClick={() => {
                                        props.showAddress(firstFreshAddress.path);
                                    }}
                                    // isDisabled={device.connected && !discovery.completed}
                                    icon="EYE"
                                >
                                    <FormattedMessage {...l10nMessages.TR_SHOW_FULL_ADDRESS} />
                                </ShowAddressButton>
                            )}
                        {(isAddressVerified(firstFreshAddress.path) ||
                            isAddressUnverified(firstFreshAddress.path)) &&
                            !isAddressVerifying(firstFreshAddress.path) && (
                                <EyeButton
                                    isDisabled={props.showButtonDisabled}
                                    device={props.device}
                                    isAddressUnverified={isAddressUnverified(
                                        firstFreshAddress.path,
                                    )}
                                    onClick={() => {
                                        props.showAddress(firstFreshAddress.path);
                                    }}
                                />
                            )}
                    </>
                }
            />

            {props.networkType === 'bitcoin' && addresses && (
                <>
                    <ButtonsWrapper>
                        <AddFreshAddress
                            variant="white"
                            onClick={() => {
                                setFreshAddrCount(freshAddrCount + 1);
                            }}
                            icon="PLUS"
                            isDisabled={freshAddrCount >= SETTINGS.FRESH_ADDRESS_LIMIT + 1}
                        >
                            <FormattedMessage {...l10nMessages.TR_ADD_FRESH_ADDRESS} />
                        </AddFreshAddress>
                    </ButtonsWrapper>

                    <FreshAddressList
                        key={props.account.descriptor}
                        addresses={addresses.unused.slice(1, freshAddrCount + 1)}
                        setSelectedAddr={setSelectedAddr}
                        selectedAddress={selectedAddr}
                        paginationEnabled={false}
                        isAddressVerifying={isAddressVerifying}
                        collapsed={false}
                        tooltipActions={tooltipAction}
                        isAddressPartiallyHidden={props.isAddressPartiallyHidden}
                        actions={addr => (
                            <>
                                {!isAddressVerified(addr.path) &&
                                !isAddressUnverified(addr.path) &&
                                !isAddressVerifying(addr.path) && ( // !account.imported
                                        <ShowAddressButton
                                            isDisabled={props.showButtonDisabled}
                                            onClick={() => props.showAddress(addr.path)}
                                            icon="EYE"
                                        >
                                            <FormattedMessage
                                                {...l10nMessages.TR_SHOW_FULL_ADDRESS}
                                            />
                                        </ShowAddressButton>
                                    )}
                                {(isAddressVerified(addr.path) || isAddressUnverified(addr.path)) &&
                                    !isAddressVerifying(addr.path) && (
                                        <EyeButton
                                            isDisabled={props.showButtonDisabled}
                                            device={props.device}
                                            isAddressUnverified={isAddressUnverified(addr.path)}
                                            onClick={() => props.showAddress(addr.path)}
                                        />
                                    )}
                            </>
                        )}
                    />
                </>
            )}

            {selectedAddr &&
                (isAddressVerified(selectedAddr.path) || isAddressUnverified(selectedAddr.path)) &&
                !isAddressVerifying(selectedAddr.path) && (
                    <QrCode value={selectedAddr.address} accountPath={selectedAddr.path} />
                )}
        </Wrapper>
    );
};

export default ReceiveForm;
