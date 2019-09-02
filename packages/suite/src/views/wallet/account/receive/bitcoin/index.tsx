import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import Title from '@wallet-components/Title';
import { FormattedMessage } from 'react-intl';

import QrCode from '@wallet-components/QrCode';
import AddressList from '@suite/components/wallet/AddressList';
import { H6, variables, Button } from '@trezor/components';
import { Address } from 'trezor-connect';
import AddressItem from '@suite/components/wallet/AddressItem';
import { selectText } from '@suite/utils/suite/dom';
import ShowOnTrezorEyeButton from '@suite/components/wallet/ShowOnTrezorEyeButton';
import SETTINGS from '@suite-config/settings';
import { parseBIP44Path } from '@suite/utils/wallet/accountUtils';
import messages from './messages';
import { ReceiveProps } from '../index';

const Wrapper = styled.div``;

// const SubHeading = styled(H6)`
//     font-weight: ${variables.FONT_WEIGHT.MEDIUM};
// `;

const AddFreshAddress = styled(Button)``;

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

const ShowAddressButton = styled(Button)`
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

const ShowMoreButton = styled(Button)`
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
    margin-top: 10px;
`;

const PreviousAddressList = styled(AddressList)`
    margin-bottom: 10px;
`;

const BitcoinReceive = ({ className, ...props }: ReceiveProps) => {
    const firstFreshAddrRef = useRef<HTMLDivElement>();

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
                actions={addrPath => (
                    <ShowOnTrezorEyeButton
                        device={props.device}
                        isAddressUnverified={props.isAddressUnverified}
                        onClick={() => props.showAddress(addrPath)}
                    />
                )}
                controls={(page, setPage, isCollapsed, setIsCollapsed, moreItems) => (
                    <TitleWrapper>
                        {!isCollapsed && <SubHeading>Previous addresses</SubHeading>}
                        {moreItems || isCollapsed ? (
                            <ShowMoreButton
                                isInverse
                                icon="ARROW_UP"
                                onClick={() => {
                                    setPage(page + 1);
                                    setIsCollapsed(false);
                                }}
                            >
                                Show previous addresses
                            </ShowMoreButton>
                        ) : (
                            <ShowMoreButton
                                isInverse
                                icon="ARROW_DOWN"
                                onClick={() => {
                                    setPage(-1);
                                    setIsCollapsed(true);
                                }}
                            >
                                Hide previous addresses
                            </ShowMoreButton>
                        )}
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
                    idDisabled={freshAddrCount >= SETTINGS.FRESH_ADDRESS_LIMIT + 1}
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
                actions={addrPath => (
                    <>
                        {!(props.isAddressVerified || props.isAddressUnverified) && ( // !account.imported
                            <ShowAddressButton
                                onClick={() => props.showAddress(addrPath)}
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
                                    onClick={() => props.showAddress(addrPath)}
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
