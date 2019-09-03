import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Address } from 'trezor-connect';
import { selectText } from '@suite/utils/suite/dom';
import { parseBIP44Path } from '@suite/utils/wallet/accountUtils';
import AddressItem from '../AddressItem';

const Wrapper = styled.div``;

interface Props extends Omit<React.HTMLAttributes<HTMLDivElement>, 'controls'> {
    accountPath: string;
    addresses: Address[];
    setSelectedAddr: any;
    selectedAddress: Address | null;
    collapsed?: boolean;
    paginationEnabled: boolean;
    actions?: (addr: Address) => React.ReactNode;
    controls?: (
        page: number,
        setPage: React.Dispatch<React.SetStateAction<number>>,
        hidden: boolean,
        setHidden: React.Dispatch<React.SetStateAction<boolean>>,
        moreItems: boolean,
    ) => React.ReactNode;
    secondaryText?: (addr: Address) => React.ReactNode;
    tooltipActions?: (addr: Address) => React.ReactNode;
}

const AddressList = ({
    addresses,
    setSelectedAddr,
    selectedAddress,
    paginationEnabled,
    collapsed = true,
    actions,
    controls,
    secondaryText,
    tooltipActions,
    ...rest
}: Props) => {
    // refs are passed to an element inside the AddressItem which contains addr descriptor
    const addrRefs = Array.from({ length: addresses.length }, _a =>
        React.createRef<HTMLDivElement>(),
    );

    const totalCount = addresses.length;
    const perPage = 10;
    const [page, setPage] = useState(-1);
    const [isCollapsed, setIsCollapsed] = useState(true);
    const endIndex = totalCount - 1;
    let startIndex = endIndex - (page + 1) * perPage;
    startIndex = startIndex > 0 ? startIndex : 0;
    const moreItems = startIndex > 0;

    useEffect(() => {
        // initialize from props
        setIsCollapsed(collapsed);
    }, [collapsed]);

    const items = addresses.map((addr, i) => (
        <AddressItem
            key={addr.address}
            ref={addrRefs[i]}
            onClick={() => {
                if (addrRefs[i].current) {
                    selectText(addrRefs[i].current as HTMLElement);
                }
                setSelectedAddr(addr);
            }}
            secondaryText={secondaryText ? secondaryText(addr) : null}
            isSelected={addr === selectedAddress}
            address={addr.address}
            index={parseBIP44Path(addr.path)!.addrIndex}
            actions={actions ? actions(addr) : null}
            tooltipActions={tooltipActions ? tooltipActions(addr) : null}
        />
    ));

    if (items.length === 0) {
        // do not render controls or items
        return null;
    }

    if (isCollapsed) {
        return (
            <Wrapper {...rest}>
                {controls && controls(page, setPage, isCollapsed, setIsCollapsed, moreItems)}
            </Wrapper>
        );
    }

    return (
        <Wrapper {...rest}>
            <>
                {controls && controls(page, setPage, isCollapsed, setIsCollapsed, moreItems)}
                {paginationEnabled ? items.slice(startIndex, endIndex + 1) : items}
            </>
        </Wrapper>
    );
};

export default AddressList;
