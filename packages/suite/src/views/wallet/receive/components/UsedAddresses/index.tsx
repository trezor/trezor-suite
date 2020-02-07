import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { colors, Button } from '@trezor/components-v2';
import { Card } from '@suite-components';
import { parseBIP44Path, formatNetworkAmount } from '@wallet-utils/accountUtils';
import { ChildProps as Props } from '../../index';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin-bottom: 40px;
`;

const GridTable = styled.div<{ header?: boolean; fresh?: boolean; revealed?: boolean }>`
    display: grid;
    grid-template-columns: minmax(60px, 1fr) 4fr 110px 3fr;
    color: ${colors.BLACK50};
    font-size: 12px;
    border-bottom: 1px solid #ddd;
    &:first-child,
    &:last-child {
        border: 0px;
    }
    ${props =>
        props.header &&
        css`
            background: ${colors.BLACK96};
            text-transform: uppercase;
            font-weight: 600;
        `};
    ${props =>
        (props.fresh || props.revealed) &&
        css`
            color: ${colors.BLACK0};
        `};
    @media all and (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`;

const GridItem = styled.div<{ right?: boolean; onClick?: Function; amount?: boolean }>`
    padding: 16px 4px;
    &:first-child {
        padding-left: 16px;
    }
    &:last-child {
        padding-right: 16px;
    }
    ${props =>
        props.right &&
        css`
            text-align: right;
            padding-right: 8px;
        `};
    ${props =>
        props.amount &&
        css`
            color: ${colors.BLACK0};
            text-transform: uppercase;
        `};
    ${props =>
        props.onClick &&
        css`
            cursor: pointer;
        `};
    @media all and (max-width: 1024px) {
        padding: 4px;
        text-align: left;
        &:first-child,
        &:last-child {
            padding: 4px;
        }
    }
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 32px;
`;

const DEFAULT_LIMIT = 10;

const Item = ({ addr, symbol, onClick, revealed }: any) => {
    const amount = addr.received ? `${formatNetworkAmount(addr.received, symbol)} ${symbol}` : null;
    const address =
        addr.transfers < 1 || revealed ? addr.address : `${addr.address.substring(0, 15)}…`;
    return (
        <GridTable fresh={addr.transfers < 1}>
            <GridItem>/{parseBIP44Path(addr.path)!.addrIndex}</GridItem>
            <GridItem onClick={onClick}>{address}</GridItem>
            <GridItem right>{addr.transfers < 1 ? 'Not used yet' : addr.transfers}</GridItem>
            <GridItem amount>{amount}</GridItem>
        </GridTable>
    );
};

const UsedAddresses = ({ account, addresses, showAddress }: Props) => {
    const [limit, setLimit] = useState(DEFAULT_LIMIT);
    if (account.networkType !== 'bitcoin' || !account.addresses) return null;
    const { used, unused } = account.addresses;
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
            <GridTable header>
                <GridItem>Path</GridItem>
                <GridItem>Address</GridItem>
                <GridItem right>Transactions</GridItem>
                <GridItem>Total received</GridItem>
            </GridTable>
            {list.slice(0, limit).map(addr => (
                <Item
                    key={addr.path}
                    addr={addr}
                    symbol={account.symbol}
                    revealed={!!addresses.find(f => f.address === addr.address)}
                    onClick={() => showAddress(addr.path, addr.address)}
                />
            ))}
            {actionButtonsVisible && (
                <Actions>
                    {actionShowVisible && (
                        <Button
                            variant="tertiary"
                            icon="ARROW_DOWN"
                            alignIcon="right"
                            onClick={() => setLimit(limit + 20)}
                        >
                            Show more
                        </Button>
                    )}
                    {actionHideVisible && (
                        <Button
                            variant="tertiary"
                            icon="ARROW_UP"
                            onClick={() => setLimit(DEFAULT_LIMIT)}
                        >
                            Show less
                        </Button>
                    )}
                </Actions>
            )}
        </StyledCard>
    );
};

export default UsedAddresses;
