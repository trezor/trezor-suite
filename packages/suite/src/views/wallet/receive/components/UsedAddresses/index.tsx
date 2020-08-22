import React, { useState, createRef } from 'react';
import styled, { css } from 'styled-components';
import { colors, variables, Button, Icon } from '@trezor/components';
import {
    Card,
    Translation,
    HiddenPlaceholder,
    FiatValue,
    Badge,
    MetadataButton,
} from '@suite-components';
import { parseBIP44Path, formatNetworkAmount } from '@wallet-utils/accountUtils';
import { copyToClipboard } from '@suite-utils/dom';
import { ChildProps as Props } from '../../Container';
import { AccountAddress } from 'trezor-connect';
import { Network, ReceiveInfo } from '@wallet-types';
import { MetadataAddPayload } from '@suite-types/metadata';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin-bottom: 40px;
    padding: ${CARD_PADDING_SIZE};
    padding-top: 0px;
`;

const GridTable = styled.div`
    display: grid;
    grid-template-columns: auto 0.65fr 0.35fr auto;
    color: ${colors.BLACK50};
    font-size: 12px;
    @media all and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-template-columns: auto 1fr auto;
        grid-auto-flow: dense;
    }
`;

// min-width: 0; // to resolve an issue with truncate text
const GridItem = styled.div<{ revealed?: boolean; onClick?: Function }>`
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    white-space: nowrap;
    padding: 8px 24px;
    border-bottom: 2px solid ${colors.BLACK96};
    font-variant-numeric: tabular-nums;

    &:nth-child(1n) {
        padding-left: 0px;
    }
    &:nth-child(4n) {
        padding-right: 0px;
    }
    &:nth-last-child(-n + 4) {
        border: 0;
    }
    ${props =>
        props.revealed &&
        css`
            color: ${colors.BLACK0};
        `};
    ${props =>
        props.onClick &&
        css`
            cursor: pointer;
        `};

    @media all and (max-width: ${variables.SCREEN_SIZE.MD}) {
        border: 0;
        padding: 8px;
        &:nth-child(4n + 3) {
            top: 43px;
            padding-top: 0px;
            padding-right: 0px;
            grid-column: 1 / 4;
            border-bottom: 2px solid ${colors.BLACK96};
        }
        &:nth-child(1),
        &:nth-child(2),
        &:nth-child(4) {
            padding-top: ${CARD_PADDING_SIZE};
        }
        &:nth-last-child(-n + 4) {
            border: 0;
        }
    }
`;

const GridItemAddress = styled(GridItem)`
    font-variant-numeric: tabular-nums slashed-zero;
`;

const HeaderItem = styled(GridItem)`
    text-transform: uppercase;
    font-weight: 600;
    position: sticky;
    top: 0;
    padding-top: ${CARD_PADDING_SIZE};
    background: ${colors.WHITE};
`;

const IconButton = styled(Button)`
    padding: 0px 0px;
    background: transparent;
    &:hover,
    &:active,
    &:focus {
        background: transparent;
    }

    ${props =>
        props.isDisabled &&
        css`
            svg {
                fill: ${colors.BLACK80};
            }
        `};
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 32px;
`;

const DEFAULT_LIMIT = 10;

interface ItemProps {
    index: number;
    addr: AccountAddress;
    symbol: Network['symbol'];
    revealed?: ReceiveInfo;
    metadataPayload: MetadataAddPayload;
    onClick: () => void;
    onCopy: () => void;
}

const Item = ({ addr, symbol, onClick, onCopy, revealed, metadataPayload, index }: ItemProps) => {
    const amount = formatNetworkAmount(addr.received || '0', symbol, true);
    const [amountF] = amount.split(' ');
    const fresh = addr.transfers < 1;
    const isRevealed = !!revealed;
    const address = revealed ? addr.address : `${addr.address.substring(0, 15)}…`;

    const dropdownOptions = [
        {
            callback: () => onClick(),
            label: 'Confirm on device',
            key: 'confirm-on-device',
            'data-test': '@metadata/confirm-on-device-button',
        },
    ];
    if (isRevealed) {
        dropdownOptions.push({
            callback: onCopy,
            label: 'Copy address',
            key: 'copy-address',
            'data-test': '@metadata/copy-address-button',
        });
    }
    return (
        <>
            <GridItem revealed={isRevealed}>/{parseBIP44Path(addr.path)!.addrIndex}</GridItem>
            <GridItemAddress
                data-test={`@wallet/receive/used-address/${index}`}
                revealed={isRevealed}
            >
                <MetadataButton
                    payload={{
                        ...metadataPayload,
                    }}
                    // if metadata is present, confirm on device option will become available in dropdown
                    defaultVisibleValue={
                        // eslint-disable-next-line
                        <span
                            style={{ cursor: 'pointer' }}
                            onClick={!metadataPayload.value ? onClick : () => {}}
                        >
                            {address}
                        </span>
                    }
                    dropdownOptions={dropdownOptions}
                />
                {/* {address} */}
                {revealed && !revealed.isVerified && (
                    <Icon
                        size={14}
                        icon="WARNING"
                        color={colors.RED}
                        style={{ marginLeft: '12px' }}
                    />
                )}
            </GridItemAddress>
            <GridItem revealed={isRevealed}>
                {!fresh && (
                    <>
                        <HiddenPlaceholder>{amount}</HiddenPlaceholder>
                        <FiatValue amount={amountF} symbol={symbol}>
                            {({ value }) =>
                                value ? (
                                    <Badge>
                                        <HiddenPlaceholder>{value}</HiddenPlaceholder>
                                    </Badge>
                                ) : null
                            }
                        </FiatValue>
                    </>
                )}
                {fresh && <Translation id="RECEIVE_TABLE_NOT_USED" />}
            </GridItem>
            <GridItem>
                <IconButton variant="tertiary" isDisabled={!revealed} onClick={onCopy}>
                    <Icon size={16} icon="COPY" />
                </IconButton>
            </GridItem>
        </>
    );
};

const UsedAddresses = ({
    account,
    addresses,
    showAddress,
    addToast,
    locked,
    accountKey,
}: Props) => {
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

    const htmlElement = createRef<HTMLDivElement>();

    const copyAddress = (address: string) => {
        const result = copyToClipboard(address, htmlElement.current);
        if (typeof result !== 'string') {
            addToast({ type: 'copy-to-clipboard' });
        }
    };

    return (
        <StyledCard>
            <GridTable>
                <HeaderItem>
                    <Translation id="RECEIVE_TABLE_PATH" />
                </HeaderItem>
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
                            accountKey,
                            defaultValue: addr.address,
                            value: addressLabels[addr.address],
                        }}
                        revealed={addresses.find(f => f.address === addr.address)}
                        onClick={() => (!locked ? showAddress(addr.path, addr.address) : undefined)}
                        onCopy={() => copyAddress(addr.address)}
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
