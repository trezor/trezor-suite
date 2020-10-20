import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { colors, variables, Button } from '@trezor/components';
import { Card, Translation, HiddenPlaceholder, MetadataLabeling } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { ChildProps as Props } from '../../Container';
import { AccountAddress } from 'trezor-connect';
import { Network, ReceiveInfo } from '@wallet-types';
import { MetadataAddPayload } from '@suite-types/metadata';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin-bottom: 40px;
    /* padding: 25px; */
    padding: 0px;
    overflow: hidden;
`;

const GridTable = styled.div`
    display: grid;
    grid-template-columns: 0.65fr 0.35fr auto;
    color: ${colors.BLACK50};
    font-size: ${variables.FONT_SIZE.SMALL};
`;

// min-width: 0; // to resolve an issue with truncate text
const GridItem = styled.div<{ revealed?: boolean; onClick?: Function }>`
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    white-space: nowrap;
    padding: 16px 0px 12px 0px;
    border-bottom: 1px solid ${colors.NEUE_STROKE_GREY};
    font-variant-numeric: tabular-nums;
    color: ${colors.NEUE_TYPE_DARK_GREY};
    font-weight: 500;

    &:nth-child(1n) {
        padding-left: 25px;
    }
    &:nth-child(3n) {
        padding-right: 25px;
    }
    &:nth-last-child(-n + 3) {
        border: 0;
    }

    ${props =>
        props.onClick &&
        css`
            cursor: pointer;
        `};
`;

const GridItemAddress = styled(GridItem)`
    font-variant-numeric: tabular-nums slashed-zero;

    /* these two ensure proper metadata behavior */
    white-space: nowrap;
    overflow: hidden;
`;

const AddressActions = styled.div<{ hide?: boolean }>`
    opacity: ${props => (props.hide ? '0' : '1')};
`;

const Gray = styled.span`
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
`;

const HeaderItem = styled(GridItem)`
    position: sticky;
    top: 0;
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
    font-weight: 500;
    padding: 12px 0px;
    background: ${colors.WHITE};
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    margin: 16px 0px;

    button + button {
        margin-left: 16px;
    }
`;

const AddressWrapper = styled.span`
    text-overflow: ellipsis;
    overflow: hidden;
    position: relative;
`;

const Overlay = styled.div`
    top: 0px;
    right: 0px;
    bottom: 0px;
    left: 0px;
    position: absolute;
    background-image: linear-gradient(to right, rgba(0, 0, 0, 0) 0%, rgba(255, 255, 255, 1) 120px);
`;

const DEFAULT_LIMIT = 10;

interface ItemProps {
    index: number;
    addr: AccountAddress;
    symbol: Network['symbol'];
    revealed?: ReceiveInfo;
    metadataPayload: MetadataAddPayload;
    onClick: () => void;
}

const Item = ({ addr, symbol, onClick, metadataPayload, index }: ItemProps) => {
    // Currently used addresses are always partially hidden
    // The only place where full address is shown is confirm-addr modal
    const [isHovered, setIsHovered] = React.useState(false);
    const amount = formatNetworkAmount(addr.received || '0', symbol, true);
    const fresh = addr.transfers < 1;
    const address = addr.address.substring(0, 20);

    return (
        <>
            <GridItemAddress
                data-test={`@wallet/receive/used-address/${index}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <MetadataLabeling
                    payload={{
                        ...metadataPayload,
                    }}
                    // if metadata is present, confirm on device option will become available in dropdown
                    defaultVisibleValue={
                        <AddressWrapper>
                            <Overlay />
                            {address}
                        </AddressWrapper>
                    }
                />
            </GridItemAddress>
            <GridItem
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {!fresh && <HiddenPlaceholder>{amount}</HiddenPlaceholder>}
                {fresh && (
                    <Gray>
                        <Translation id="RECEIVE_TABLE_NOT_USED" />
                    </Gray>
                )}
            </GridItem>
            <GridItem
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <AddressActions hide={!isHovered}>
                    <Button
                        data-test={`@metadata/confirm-on-device-button/${index}`}
                        variant="tertiary"
                        onClick={onClick}
                    >
                        <Translation id="TR_REVEAL_ADDRESS" />
                    </Button>
                </AddressActions>
            </GridItem>
        </>
    );
};

const UsedAddresses = ({ account, addresses, showAddress, locked }: Props) => {
    const [limit, setLimit] = useState(DEFAULT_LIMIT);
    if (account.networkType !== 'bitcoin' || !account.addresses) return null;
    const { used, unused } = account.addresses;
    const { addressLabels } = account.metadata;
    // find revealed addresses in `unused` list
    const revealed = addresses.reduce((result, addr) => {
        const x = unused.find(u => u.path === addr.path);
        return x ? result.concat(x) : result;
    }, [] as typeof unused);
    // TODO: add skipped addresses?
    // add revealed addresses to `used` list
    const list = revealed.concat(used.slice().reverse());
    if (list.length < 1) return null;

    const actionButtonsVisible = list.length > DEFAULT_LIMIT;
    const actionShowVisible = limit < list.length;
    const actionHideVisible = limit > DEFAULT_LIMIT;

    return (
        <StyledCard>
            <GridTable>
                <HeaderItem>
                    <Translation id="RECEIVE_TABLE_ADDRESS" />
                </HeaderItem>
                <HeaderItem>
                    <Translation id="RECEIVE_TABLE_RECEIVED" />
                </HeaderItem>
                <HeaderItem />
                {list.slice(0, limit).map((addr, index) => (
                    <Item
                        index={index}
                        key={addr.path}
                        addr={addr}
                        symbol={account.symbol}
                        metadataPayload={{
                            type: 'addressLabel',
                            accountKey: account.key,
                            defaultValue: addr.address,
                            value: addressLabels[addr.address],
                        }}
                        onClick={() => (!locked ? showAddress(addr.path, addr.address) : undefined)}
                    />
                ))}
            </GridTable>
            {actionButtonsVisible && (
                <Actions>
                    {actionShowVisible && (
                        <Button
                            variant="tertiary"
                            icon="ARROW_DOWN"
                            alignIcon="right"
                            onClick={() => setLimit(limit + 20)}
                        >
                            <Translation id="TR_SHOW_MORE" />
                        </Button>
                    )}
                    {actionHideVisible && (
                        <Button
                            variant="tertiary"
                            icon="ARROW_UP"
                            onClick={() => setLimit(DEFAULT_LIMIT)}
                        >
                            <Translation id="TR_SHOW_LESS" />
                        </Button>
                    )}
                </Actions>
            )}
        </StyledCard>
    );
};

export default UsedAddresses;
