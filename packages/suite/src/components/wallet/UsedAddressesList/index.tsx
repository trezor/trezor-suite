import React, { useState } from 'react';
import styled from 'styled-components';
import { Address } from 'trezor-connect';
import { variables, colors, Button, H6 } from '@trezor/components';
import { ReceiveProps } from '@suite/views/wallet/account/receive';
import ShowOnTrezorEyeButton from '@wallet-components/ShowOnTrezorEyeButton';
import { selectText } from '@suite/utils/suite/dom';
import UsedAddressItem from '../AddressItem';

const SubHeading = styled(H6)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ShowMoreButton = styled(Button)``;

const TitleWrapper = styled.div`
    display: flex;
    padding: 4px;
    justify-content: space-between;
`;

const TextGreen = styled.span`
    color: ${colors.GREEN_PRIMARY};
`;

interface Props
    extends Pick<
        ReceiveProps,
        | 'isAddressVerifying'
        | 'isAddressUnverified'
        | 'isAddressHidden'
        | 'isAddressVerified'
        | 'showAddress'
        | 'device'
    > {
    accountPath: string;
    addresses: Address[];
    setSelectedAddr: any;
    selectedAddress: Address | null;
}

const UsedAddressesList = (props: Props) => {
    const addrRefs = Array.from({ length: props.addresses.length }, _a =>
        React.createRef<HTMLDivElement>(),
    );

    const totalCount = props.addresses.length;
    const perPage = 10;
    const [page, setPage] = useState(0);
    const [hidden, setHidden] = useState(true);
    const endIndex = totalCount - 1;
    let startIndex = endIndex - (page + 1) * perPage;
    startIndex = startIndex > 0 ? startIndex : 0;
    const isPaginationEnabled = startIndex > 0;

    const items = props.addresses
        .map((addr, i) => (
            <UsedAddressItem
                key={addr.address}
                ref={addrRefs[i]}
                onClick={() => {
                    if (addrRefs[i].current) {
                        selectText(addrRefs[i].current as HTMLElement);
                    }
                    props.setSelectedAddr(addr);
                }}
                secondaryText={
                    <>
                        Total received: <TextGreen>x BTC</TextGreen>
                    </>
                }
                isSelected={addr === props.selectedAddress}
                addr={addr}
                index={i}
                actions={
                    <ShowOnTrezorEyeButton
                        device={props.device}
                        accountPath={addr.path}
                        isAddressVerifying={props.isAddressVerifying}
                        isAddressUnverified={props.isAddressUnverified}
                        isAddressHidden={props.isAddressHidden}
                        isAddressVerified={props.isAddressVerified}
                        showAddress={props.showAddress}
                    />
                }
            />
        ))
        .slice(startIndex, endIndex + 1);

    if (items.length === 0) {
        return null;
    }

    return (
        <>
            <TitleWrapper>
                <SubHeading>Previous addresses</SubHeading>
                {isPaginationEnabled || hidden ? (
                    <ShowMoreButton
                        isInverse
                        icon="ARROW_UP"
                        onClick={() => {
                            setPage(page + 1);
                            setHidden(false);
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
                            setHidden(true);
                        }}
                    >
                        Hide previous addresses
                    </ShowMoreButton>
                )}
            </TitleWrapper>
            {!hidden && items}
        </>
    );
};

export default UsedAddressesList;
