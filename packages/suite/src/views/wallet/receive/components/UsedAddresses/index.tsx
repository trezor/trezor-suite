import React, { useState, createRef } from 'react';
import styled, { css } from 'styled-components';
import { colors, variables, Button, Icon } from '@trezor/components';
import { Card, Translation, HiddenPlaceholder, MetadataLabeling } from '@suite-components';
import { formatNetworkAmount } from '@wallet-utils/accountUtils';
import { copyToClipboard } from '@suite-utils/dom';
import { ChildProps as Props } from '../../Container';
import { AccountAddress } from 'trezor-connect';
import { Network, ReceiveInfo } from '@wallet-types';
import { MetadataAddPayload } from '@suite-types/metadata';
import { CARD_PADDING_SIZE } from '@suite-constants/layout';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin-bottom: 40px;
    /* padding: 25px; */
    padding: 0px;
    overflow: hidden;
`;

// const StyledMetadataLabeling = styled(MetadataLabeling)`
//     overflow: hidden;
// `;

const GridTable = styled.div`
    display: grid;
    grid-template-columns: 0.65fr 0.35fr auto;
    color: ${colors.BLACK50};
    font-size:  ${variables.FONT_SIZE.SMALL};
    /* @media all and (max-width: ${variables.SCREEN_SIZE.MD}) {
        grid-template-columns: auto 1fr auto;
        grid-auto-flow: dense;
    } */
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
    color: ${colors.NEUE_TYPE_LIGHT_GREY};
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
        props.revealed &&
        css`
            color: ${colors.NEUE_TYPE_DARK_GREY};
        `};
    ${props =>
        props.onClick &&
        css`
            cursor: pointer;
        `};

    /* @media all and (max-width: ${variables.SCREEN_SIZE.MD}) {
        border: 0;
        padding: 8px;
        &:nth-child(3n + 3) {
            top: 43px;
            padding-top: 0px;
            padding-right: 0px;
            grid-column: 1 / 3;
            border-bottom: 2px solid ${colors.BLACK96};
        }
        &:nth-child(1),
        &:nth-child(2),
        &:nth-child(3) {
            padding-top: ${CARD_PADDING_SIZE};
        }
        &:nth-last-child(-n + 3) {
            border: 0;
        }
    } */
`;

const GridItemAddress = styled(GridItem)`
    font-variant-numeric: tabular-nums slashed-zero;
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

const CopyButton = styled(Button)`
    /* opacity: 0; */
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    margin: 16px 0px;

    button + button {
        margin-left: 16px;
    }
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
    const [isHovered, setIsHovered] = React.useState(false);
    const amount = formatNetworkAmount(addr.received || '0', symbol, true);
    // const [amountF] = amount.split(' ');
    const fresh = addr.transfers < 1;
    const isRevealed = !!revealed;
    const address = revealed ? addr.address : `${addr.address.substring(0, 15)}…`;

    const dropdownOptions = [
        {
            callback: () => {
                onClick();
                return true;
            }, // return true makes dropdown to hide on click
            label: 'Confirm on device',
            key: 'confirm-on-device',
            'data-test': '@metadata/confirm-on-device-button',
        },
    ];
    if (isRevealed) {
        dropdownOptions.push({
            callback: () => {
                onCopy();
                return true;
            },
            label: 'Copy address',
            key: 'copy-address',
            'data-test': '@metadata/copy-address-button',
        });
    }
    return (
        <>
            {/* <GridItem revealed={isRevealed}>/{parseBIP44Path(addr.path)!.addrIndex}</GridItem> */}
            <GridItemAddress
                data-test={`@wallet/receive/used-address/${index}`}
                revealed={isRevealed}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <MetadataLabeling
                    payload={{
                        ...metadataPayload,
                    }}
                    // if metadata is present, confirm on device option will become available in dropdown
                    defaultVisibleValue={
                        // eslint-disable-next-line
                        <span
                            style={{
                                cursor: 'pointer',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                            }}
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
            <GridItem
                revealed={isRevealed}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {!fresh && (
                    <>
                        <HiddenPlaceholder>{amount}</HiddenPlaceholder>
                        {/* <FiatValue amount={amountF} symbol={symbol}>
                            {({ value }) =>
                                value ? (
                                    <Badge>
                                        <HiddenPlaceholder>{value}</HiddenPlaceholder>
                                    </Badge>
                                ) : null
                            }
                        </FiatValue> */}
                    </>
                )}
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
                    {/* {revealed ? (
                        <CopyButton variant="tertiary" isDisabled={!revealed} onClick={onCopy}>
                            Copy address
                        </CopyButton>
                    ) : (
                        <CopyButton variant="tertiary" onClick={onClick}>
                            Reveal address
                        </CopyButton>
                    )} */}
                    <CopyButton variant="tertiary" onClick={onClick}>
                        Reveal address
                    </CopyButton>
                </AddressActions>
            </GridItem>
        </>
    );
};

const UsedAddresses = ({ account, addresses, showAddress, addToast, locked }: Props) => {
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
                {/* <HeaderItem>
                    <Translation id="RECEIVE_TABLE_PATH" />
                </HeaderItem> */}
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
                        // revealed={addresses.find(f => f.address === addr.address)}
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
