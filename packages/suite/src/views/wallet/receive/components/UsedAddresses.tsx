import { useState } from 'react';
import styled from 'styled-components';

import { AccountAddress } from '@trezor/connect';
import { Card, Button, GradientOverlay } from '@trezor/components';
import { Translation, MetadataLabeling, FormattedCryptoAmount } from 'src/components/suite';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Network } from 'src/types/wallet';
import { AppState } from 'src/types/suite';
import { MetadataAddPayload } from 'src/types/suite/metadata';
import { showAddress } from 'src/actions/wallet/receiveActions';
import { useDispatch } from 'src/hooks/suite/';
import { useSelector } from 'src/hooks/suite/useSelector';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { spacingsPx, typography } from '@trezor/theme';

const StyledCard = styled(Card)`
    flex-direction: column;
    margin-bottom: ${spacingsPx.xxxl};
    overflow: hidden;
    padding: ${spacingsPx.xl};
`;

const GridTable = styled.div`
    display: grid;
    grid-template-columns: auto 0.2fr 0.2fr;
    ${typography.hint}
`;

// min-width: 0; // to resolve an issue with truncate text
const GridItem = styled.div<{ revealed?: boolean; onClick?: () => void; align?: 'left' | 'right' }>`
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    white-space: nowrap;
    padding: ${spacingsPx.md} 0 ${spacingsPx.sm};
    font-variant-numeric: tabular-nums;
    ${typography.hint}
    ${({ align }) => (align === 'right' ? `justify-content:flex-end` : '')};
    cursor: ${({ onClick }) => onClick && 'pointer'};

    :nth-child(3n + 2) {
        padding-right: ${spacingsPx.md};
    }

    :nth-last-child(-n + 3) {
        border: 0;
    }
`;

const GridItemRevealAddress = styled(GridItem)`
    justify-content: flex-end;
`;

const GridItemAddress = styled(GridItem)`
    font-variant-numeric: tabular-nums slashed-zero;

    /* these two ensure proper metadata behavior */
    white-space: nowrap;
    overflow: hidden;
`;

const AddressActions = styled.div<{ isVisible?: boolean }>`
    opacity: ${({ isVisible }) => (isVisible ? '1' : '0')};
`;

const Gray = styled.span`
    color: ${({ theme }) => theme.textSubdued};
`;

const HeaderItem = styled(GridItem)`
    position: sticky;
    top: 0;
    color: ${({ theme }) => theme.textSubdued};
    border-bottom: 1px solid ${({ theme }) => theme.borderOnElevation1};
    padding: 0 0 ${spacingsPx.sm};
`;

const Actions = styled.div`
    display: flex;
    justify-content: center;
    margin: 16px 0;

    button + button {
        margin-left: 16px;
    }
`;

const AddressWrapper = styled.span`
    text-overflow: ellipsis;
    overflow: hidden;
    position: relative;
`;

const DEFAULT_LIMIT = 10;

interface ItemProps {
    index: number;
    addr: AccountAddress;
    locked: boolean;
    symbol: Network['symbol'];
    metadataPayload: MetadataAddPayload;
    onClick: () => void;
}

const Item = ({ addr, locked, symbol, onClick, metadataPayload, index }: ItemProps) => {
    // Currently used addresses are always partially hidden
    // The only place where full address is shown is confirm-addr modal

    const [isHovered, setIsHovered] = useState(false);

    const amount = formatNetworkAmount(addr.received || '0', symbol);
    const fresh = !addr.transfers;
    const address = addr.address.substring(0, 20);

    return (
        <>
            <GridItemAddress
                data-test-id={`@wallet/receive/used-address/${index}`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <MetadataLabeling
                    payload={{
                        ...metadataPayload,
                    }}
                    visible={isHovered}
                    // if metadata is present, confirm on device option will become available in dropdown
                    defaultVisibleValue={
                        <AddressWrapper>
                            <GradientOverlay hiddenFrom="120px" />
                            {address}
                        </AddressWrapper>
                    }
                />
            </GridItemAddress>
            <GridItemRevealAddress
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <AddressActions isVisible={isHovered}>
                    <Button
                        data-test-id={`@wallet/receive/reveal-address-button/${index}`}
                        variant="tertiary"
                        isDisabled={locked}
                        isLoading={locked}
                        onClick={onClick}
                        size="tiny"
                    >
                        <Translation id="TR_REVEAL_ADDRESS" />
                    </Button>
                </AddressActions>
            </GridItemRevealAddress>

            <GridItem
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                align="right"
            >
                {!fresh && <FormattedCryptoAmount value={amount} symbol={symbol} />}

                {fresh && (
                    <Gray>
                        <Translation id="RECEIVE_TABLE_NOT_USED" />
                    </Gray>
                )}
            </GridItem>
        </>
    );
};

interface UsedAddressesProps {
    account: AppState['wallet']['selectedAccount']['account'];
    addresses: AppState['wallet']['receive'];
    locked: boolean;
    pendingAddresses: string[];
}

export const UsedAddresses = ({
    account,
    addresses,
    pendingAddresses,
    locked,
}: UsedAddressesProps) => {
    const [limit, setLimit] = useState(DEFAULT_LIMIT);
    const dispatch = useDispatch();
    const { addressLabels } = useSelector(selectLabelingDataForSelectedAccount);

    if (!account) {
        return null;
    }

    if (
        (account.networkType !== 'bitcoin' && account.networkType !== 'cardano') ||
        !account.addresses
    ) {
        return null;
    }

    const { used, unused } = account.addresses;
    // find revealed addresses in `unused` list
    const revealed = unused.reduce(
        (result, addr) => {
            const r = addresses.find(u => u.path === addr.path);
            const p = pendingAddresses.find(u => u === addr.address);
            const f = r || p;

            return f ? result.concat(addr) : result;
        },
        [] as typeof unused,
    );
    // TODO: add skipped addresses?
    // add revealed addresses to `used` list
    const list = revealed.concat(used.slice().reverse());

    if (list.length < 1) {
        return null;
    }

    const actionButtonsVisible = list.length > DEFAULT_LIMIT;
    const actionShowVisible = limit < list.length;
    const actionHideVisible = limit > DEFAULT_LIMIT;

    return (
        <StyledCard>
            <GridTable>
                <HeaderItem>
                    <Translation id="RECEIVE_TABLE_ADDRESS" />
                </HeaderItem>
                <HeaderItem />
                <HeaderItem align="right">
                    <Translation id="RECEIVE_TABLE_RECEIVED" />
                </HeaderItem>

                {list.slice(0, limit).map((addr, index) => (
                    <Item
                        index={index}
                        key={addr.path}
                        addr={addr}
                        symbol={account.symbol}
                        locked={locked}
                        metadataPayload={{
                            type: 'addressLabel',
                            entityKey: account.key,
                            defaultValue: addr.address,
                            value: addressLabels[addr.address],
                        }}
                        onClick={() => dispatch(showAddress(addr.path, addr.address))}
                    />
                ))}
            </GridTable>

            {actionButtonsVisible && (
                <Actions>
                    {actionShowVisible && (
                        <Button
                            variant="tertiary"
                            icon="ARROW_DOWN"
                            iconAlignment="right"
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
