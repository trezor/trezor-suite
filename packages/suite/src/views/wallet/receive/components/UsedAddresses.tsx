import { useState } from 'react';
import styled from 'styled-components';

import { AccountAddress } from '@trezor/connect';
import {
    Card,
    Button,
    Column,
    Row,
    GradientOverlay,
    Tooltip,
    Table,
    Text,
} from '@trezor/components';
import { spacings } from '@trezor/theme';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { formatNetworkAmount } from '@suite-common/wallet-utils';

import { Translation, MetadataLabeling, FormattedCryptoAmount } from 'src/components/suite';
import { AppState } from 'src/types/suite';
import { MetadataAddPayload } from 'src/types/suite/metadata';
import { showAddress } from 'src/actions/wallet/receiveActions';
import { useDispatch, useSelector } from 'src/hooks/suite/';
import { selectLabelingDataForSelectedAccount } from 'src/reducers/suite/metadataReducer';
import { selectIsFirmwareAuthenticityCheckEnabledAndFailed } from 'src/reducers/suite/suiteReducer';

const AddressActions = styled.div<{ $isVisible?: boolean }>`
    opacity: ${({ $isVisible }) => ($isVisible ? '1' : '0')};
`;

const AddressWrapper = styled.div`
    white-space: nowrap;
    overflow: hidden;
    position: relative;
    font-variant-numeric: tabular-nums slashed-zero;
`;

const DEFAULT_LIMIT = 10;

type ItemProps = {
    index: number;
    addr: AccountAddress;
    locked: boolean;
    symbol: NetworkSymbol;
    metadataPayload: MetadataAddPayload;
    onClick: () => void;
};

const Item = ({ addr, locked, symbol, onClick, metadataPayload, index }: ItemProps) => {
    const isAuthenticityCheckFailed = useSelector(
        selectIsFirmwareAuthenticityCheckEnabledAndFailed,
    );
    const [isHovered, setIsHovered] = useState(false);

    const amount = formatNetworkAmount(addr.received || '0', symbol);
    const fresh = !addr.transfers;
    const address = addr.address.substring(0, 20);
    const isDisabled = locked || isAuthenticityCheckFailed;
    const tooltipContent = isAuthenticityCheckFailed ? (
        <Translation id="TR_RECEIVE_ADDRESS_SECURITY_CHECK_FAILED" />
    ) : null;

    return (
        <Table.Row onHover={setIsHovered}>
            <Table.Cell>
                <Text typographyStyle="hint" data-testid={`@wallet/receive/used-address/${index}`}>
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
                </Text>
            </Table.Cell>
            <Table.Cell align="right">
                <AddressActions $isVisible={isHovered}>
                    <Tooltip content={tooltipContent}>
                        <Button
                            data-testid={`@wallet/receive/reveal-address-button/${index}`}
                            variant="tertiary"
                            isDisabled={isDisabled}
                            isLoading={locked}
                            onClick={onClick}
                            size="tiny"
                        >
                            <Translation id="TR_REVEAL_ADDRESS" />
                        </Button>
                    </Tooltip>
                </AddressActions>
            </Table.Cell>

            <Table.Cell align="right">
                <Text typographyStyle="hint">
                    {fresh ? (
                        <Text variant="tertiary">
                            <Translation id="RECEIVE_TABLE_NOT_USED" />
                        </Text>
                    ) : (
                        <FormattedCryptoAmount value={amount} symbol={symbol} />
                    )}
                </Text>
            </Table.Cell>
        </Table.Row>
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
        <Card margin={{ bottom: spacings.xxxl }} overflow="hidden" paddingType="normal">
            <Column alignItems="stretch" gap={spacings.md}>
                <Table>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>
                                <Translation id="RECEIVE_TABLE_ADDRESS" />
                            </Table.Cell>
                            <Table.Cell />
                            <Table.Cell align="right">
                                <Translation id="RECEIVE_TABLE_RECEIVED" />
                            </Table.Cell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
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
                    </Table.Body>
                </Table>

                {actionButtonsVisible && (
                    <Row justifyContent="center" gap={spacings.md}>
                        {actionShowVisible && (
                            <Button
                                variant="tertiary"
                                icon="chevronDown"
                                iconAlignment="right"
                                onClick={() => setLimit(limit + 20)}
                                data-testid="@wallet/receive/used-address/show-more"
                            >
                                <Translation id="TR_SHOW_MORE" />
                            </Button>
                        )}

                        {actionHideVisible && (
                            <Button
                                variant="tertiary"
                                icon="chevronUp"
                                onClick={() => setLimit(DEFAULT_LIMIT)}
                            >
                                <Translation id="TR_SHOW_LESS" />
                            </Button>
                        )}
                    </Row>
                )}
            </Column>
        </Card>
    );
};
