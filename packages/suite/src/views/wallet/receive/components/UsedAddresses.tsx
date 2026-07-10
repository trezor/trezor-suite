import { useState } from 'react';

import { Address, selectAddressLabelsForAccount } from '@suite/address';
import { Translation, useTranslation } from '@suite/intl';
import { Labeling } from '@suite/labeling';
import { showAddressThunk, useReceiveDisabled } from '@suite/receive';
import { getUsedAddressesList } from '@suite-common/address';
import { type MetadataAddPayload } from '@suite-common/metadata-types';
import { selectCurrentFreshAddress, selectTouchedAddresses } from '@suite-common/receive';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Button, Card, Column, Row, Table, Text } from '@trezor/components';
import { type AccountAddress } from '@trezor/connect';
import { getAddressPathIndex } from '@trezor/crypto-utils';
import { CaretDownIcon, CaretUpIcon } from '@trezor/icons';
import { spacings } from '@trezor/theme';

import { FormattedCryptoAmount } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';

const DEFAULT_LIMIT = 10;

type ItemProps = {
    index: number;
    addr: AccountAddress;
    locked: boolean;
    symbol: NetworkSymbol;
    metadataPayload: MetadataAddPayload;
    onClick: () => void;
    account: Account;
};

const Item = ({ account, addr, locked, symbol, onClick, metadataPayload, index }: ItemProps) => {
    const { isReceiveDisabled, ReceiveDisabledWrapper } = useReceiveDisabled();
    const { translationString } = useTranslation();

    const amount = formatNetworkAmount(addr.received || '0', symbol);
    const fresh = !addr.transfers;
    const isDisabled = locked || isReceiveDisabled;
    const addressPathIndex = getAddressPathIndex(addr.path);

    return (
        <Table.Row>
            <Table.Cell>
                <Row
                    gap={spacings.xxs}
                    alignItems="center"
                    data-testid={`@wallet/receive/used-address/${index}`}
                >
                    {addressPathIndex !== undefined && (
                        <Text typographyStyle="body-md" intent="neutral" priority="secondary">
                            {addressPathIndex} /
                        </Text>
                    )}
                    <Labeling
                        payload={{
                            ...metadataPayload,
                        }}
                        deviceStaticSessionId={account.deviceState}
                        displayValue={<Address value={addr.address} isTruncated />}
                        placeholder={translationString('TR_LABELING_ADDRESS_LABEL')}
                        minHeight={28}
                        maxWidth={300}
                    >
                        {metadataPayload.value}
                    </Labeling>
                </Row>
            </Table.Cell>
            <Table.Cell align="end">
                <ReceiveDisabledWrapper>
                    <Button
                        data-testid={`@wallet/receive/reveal-address-button/${index}`}
                        intent="neutral"
                        priority="secondary"
                        isDisabled={isDisabled}
                        isLoading={locked}
                        onClick={onClick}
                        size="small"
                    >
                        <Translation id="RECEIVE_ADDRESS_REVEAL" />
                    </Button>
                </ReceiveDisabledWrapper>
            </Table.Cell>
            <Table.Cell align="end">
                <Text typographyStyle="body-sm">
                    {fresh ? (
                        <Text intent="neutral" priority="secondary">
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
    account: Account;
    locked: boolean;
    pendingAddresses: string[];
}

export const UsedAddresses = ({ account, pendingAddresses, locked }: UsedAddressesProps) => {
    const [limit, setLimit] = useState(DEFAULT_LIMIT);
    const dispatch = useDispatch();
    const currentFreshAddress = useSelector(state => selectCurrentFreshAddress(state, account.key));
    const touchedAddresses = useSelector(state => selectTouchedAddresses(state, account.key));

    const accountAddresses = account.addresses
        ? account.addresses.used.concat(account.addresses.unused).map(({ address }) => address)
        : [];

    const addressLabels = useSelector(state =>
        selectAddressLabelsForAccount(state, {
            addresses: accountAddresses,
            accountKey: account.key,
            deviceStaticId: account.deviceState,
        }),
    );

    // For account based networks, the unuses addresses does not make sense.
    if (
        (account.networkType !== 'bitcoin' && account.networkType !== 'cardano') ||
        !account.addresses
    ) {
        return null;
    }

    const list = getUsedAddressesList({
        account,
        touchedAddresses,
        pendingAddresses,
        addressLabels,
        currentFreshAddress,
    });

    if (list.length < 1) {
        return null;
    }

    const actionButtonsVisible = list.length > DEFAULT_LIMIT;
    const actionShowVisible = limit < list.length;
    const actionHideVisible = limit > DEFAULT_LIMIT;

    return (
        <Card paddingType="none">
            <Column gap={spacings.md}>
                <Table margin={{ top: spacings.xs, bottom: spacings.xs }}>
                    <Table.Header>
                        <Table.Row>
                            <Table.Cell>
                                <Translation id="RECEIVE_TABLE_ADDRESS" />
                            </Table.Cell>
                            <Table.Cell align="end" colSpan={2}>
                                <Translation id="RECEIVE_TABLE_RECEIVED" />
                            </Table.Cell>
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {list.slice(0, limit).map((addr, index) => (
                            <Item
                                account={account}
                                index={index}
                                key={addr.path}
                                addr={addr}
                                symbol={account.symbol}
                                locked={locked}
                                metadataPayload={{
                                    type: 'addressLabel',
                                    entityKey: account.key,
                                    defaultValue: addr.address,
                                    networkSymbol: account.symbol,
                                    accountDescriptor: account.descriptor,
                                    value: addressLabels[addr.address] ?? undefined,
                                }}
                                onClick={() =>
                                    dispatch(
                                        showAddressThunk({
                                            path: addr.path,
                                            address: addr.address,
                                        }),
                                    )
                                }
                            />
                        ))}
                    </Table.Body>
                </Table>

                {actionButtonsVisible && (
                    <Row justifyContent="center" gap={spacings.md} margin={{ bottom: spacings.md }}>
                        {actionShowVisible && (
                            <Button
                                intent="neutral"
                                priority="secondary"
                                iconRight={CaretDownIcon}
                                onClick={() => setLimit(limit + 20)}
                                data-testid="@wallet/receive/used-address/show-more"
                            >
                                <Translation id="TR_SHOW_MORE" />
                            </Button>
                        )}

                        {actionHideVisible && (
                            <Button
                                intent="neutral"
                                priority="secondary"
                                iconLeft={CaretUpIcon}
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
