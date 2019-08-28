import React, { useState, useRef } from 'react';
import styled, { css } from 'styled-components';
import { Address } from 'trezor-connect';
import { variables, colors, Tooltip, Link, Icon, Button, H6 } from '@trezor/components';
import { ReceiveProps } from '@suite/views/wallet/account/receive';
import ShowOnTrezorEyeButton from '@wallet-components/ShowOnTrezorEyeButton';

const AddrWrapper = styled.div<{ isSelected: boolean }>`
    display: flex;
    width: 100%;
    align-items: center;
    border-top: 1px solid #ccc;
    padding: 8px 16px;
    cursor: pointer;

    &:last-child() {
        border-bottom: 1px solid #ccc;
    }

    &:hover {
        background: #fafafa;
    }

    ${props =>
        props.isSelected &&
        css`
            background: #eee;

            &:hover {
                background: #eee;
            }
        `};
`;

const PathWrapper = styled.div`
    display: flex;
    flex: 1;
    width: 100%;
    justify-items: center;
    flex-direction: column;
    margin-right: 10px;
`;

const ActionsWrapper = styled.div`
    display: flex;
    flex: 0;
    align-items: center;
`;

const Index = styled.div`
    flex: 0;
    margin-right: 16px;
    justify-content: center;
    color: ${colors.TEXT_SECONDARY};
    font-size: ${variables.FONT_SIZE.BIG};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    align-self: baseline;
`;

const Path = styled.div`
    color: ${colors.TEXT_PRIMARY};
    font-size: ${variables.FONT_SIZE.BASE};
    font-family: ${variables.FONT_FAMILY.MONOSPACE};
    margin-bottom: 4px;
`;

const SmallText = styled.span`
    font-size: ${variables.FONT_SIZE.SMALL};
    color: ${colors.TEXT_SECONDARY};
`;

const TextGreen = styled.span`
    color: ${colors.GREEN_PRIMARY};
`;

const SubHeading = styled(H6)`
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const ShowMoreButton = styled(Button)``;

const TitleWrapper = styled.div`
    display: flex;
    padding: 4px;
    justify-content: space-between;
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
    selectedAddress: Address;
}

const selectText = (element: HTMLElement) => {
    const doc = document;
    if (window.getSelection) {
        const selection = window.getSelection();
        if (selection) {
            const range = doc.createRange();
            range.selectNodeContents(element);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }
};

const UsedAddressesList = (props: Props) => {
    const addrRefs = Array.from({ length: props.addresses.length }, _a =>
        React.createRef<HTMLElement>(),
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
            <AddrWrapper
                key={addr.address}
                onClick={() => {
                    if (addrRefs[i] && addrRefs[i].current) selectText(addrRefs[i].current);
                    props.setSelectedAddr(addr);
                }}
                isSelected={addr === props.selectedAddress}
            >
                <Index>{`/${i}`}</Index>
                <PathWrapper>
                    <Path ref={addrRefs[i]}>{addr.address}</Path>
                    <SmallText>
                        Total received: <TextGreen>x BTC</TextGreen>
                    </SmallText>
                </PathWrapper>
                <ActionsWrapper>
                    <ShowOnTrezorEyeButton
                        device={props.device}
                        accountPath={addr.path}
                        isAddressVerifying={props.isAddressVerifying}
                        isAddressUnverified={props.isAddressUnverified}
                        isAddressHidden={props.isAddressHidden}
                        isAddressVerified={props.isAddressVerified}
                        showAddress={props.showAddress}
                    />
                </ActionsWrapper>
            </AddrWrapper>
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
