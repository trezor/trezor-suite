import { useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import {
    selectIsLegacyLabelingVisible,
    selectLabelingDataForSelectedAccount,
} from '@suite/metadata';
import { type MetadataAddPayload } from '@suite-common/metadata-types';
import { selectIsSuiteSyncEnabled, selectSuiteSyncAddressLabels } from '@suite-common/suite-sync';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { Button, Card, Column, Row, Table, Text } from '@trezor/components';
import { type AccountAddress } from '@trezor/connect';
import { spacings } from '@trezor/theme';

import { showAddress } from 'src/actions/wallet/receiveActions';
import { Address, FormattedCryptoAmount, Labeling } from 'src/components/suite';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { useReceiveDisabled } from 'src/hooks/suite/useReceiveDisabled';
import { type AppState } from 'src/types/suite';

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

    return (
        <Table.Row>
            <Table.Cell>
                <Text
                    typographyStyle="body-md"
                    data-testid={`@wallet/receive/used-address/${index}`}
                >
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
                </Text>
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
    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);
    const { addressLabels } = useSelector(selectLabelingDataForSelectedAccount);
    const suiteSyncAddressLabels = useSelector(state =>
        isSuiteSyncEnabled ? selectSuiteSyncAddressLabels(state, account.deviceState) : [],
    );

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
            const p = pendingAddresses.includes(addr.address);
            const f = r || p;

            return f ? result.concat(addr) : result;
        },
        [] as typeof unused,
    );
    // TODO: add skipped addresses?
    // add revealed addresses to `used` list
    const list = used.concat(revealed).reverse();

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
                                    value:
                                        suiteSyncAddressLabels.find(
                                            it => it.address === addr.address,
                                        )?.label ??
                                        (isLegacyLabelingVisible
                                            ? addressLabels[addr.address]
                                            : undefined),
                                }}
                                onClick={() => dispatch(showAddress(addr.path, addr.address))}
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
                                iconRight="caretDown"
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
                                iconLeft="caretUp"
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
