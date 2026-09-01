import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { AccountLabel } from '@suite/account';
import { Translation } from '@suite/intl';
import { onReceiveAccount } from '@suite/modal';
import { selectAccounts } from '@suite-common/wallet-core';
import { Card, Column, Icon, Modal, Row, Skeleton, SubTabs, Table } from '@trezor/components';
import { type UiRequestSelectAccount } from '@trezor/connect';
import { CaretRightIcon } from '@trezor/icons';
import { NetworkIcon, isNetworkSymbolWithIcon } from '@trezor/product-components';

import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { ConnectModalBackdrop } from 'src/components/suite/ConnectModalBackdrop';
import { useSelector } from 'src/hooks/suite';

interface SelectAccountModalProps {
    data: UiRequestSelectAccount['payload'];
}

export const SelectAccountModal = ({ data }: SelectAccountModalProps) => {
    const dispatch = useDispatch();
    const suiteAccounts = useSelector(selectAccounts);

    const [accounts, setAccounts] = useState(data.accounts);
    const [accountTypes, setAccountTypes] = useState(data.accountTypes);
    const [selectedAccountType, setSelectedAccountType] = useState(data.defaultAccountType);

    const confirm = (accountIndex: number) => dispatch(onReceiveAccount(accountIndex));
    const close = () => dispatch(onReceiveAccount(null));

    useEffect(() => {
        if (data.accountTypes) {
            setAccountTypes(data.accountTypes);
            if (data.defaultAccountType) {
                setSelectedAccountType(data.defaultAccountType);
            } else {
                setSelectedAccountType(data.accountTypes[0]);
            }
        }
        if (data.accounts) {
            setAccounts(data.accounts);
        }
    }, [data.accountTypes, data.defaultAccountType, data.accounts]);
    const typeLabels = {
        p2wpkh: <Translation id="TR_ACCOUNT_TYPE_DEFAULT" />,
        p2tr: <Translation id="TR_ACCOUNT_TYPE_TAPROOT" />,
        p2sh: <Translation id="TR_ACCOUNT_TYPE_SEGWIT" />,
        p2pkh: <Translation id="TR_ACCOUNT_TYPE_LEGACY" />,
    };
    const indexedAccounts = accounts?.map((account, index) => ({ ...account, index }));
    const filteredAccounts = indexedAccounts?.filter(
        account => account.type === selectedAccountType,
    );

    return (
        <ConnectModalBackdrop onClick={close} canSwitchDevice>
            <Modal.ModalBase
                onCancel={close}
                intent="brand"
                heading={
                    <Translation
                        id="TR_SELECT_ACCOUNT"
                        values={{ networkName: data.coinInfo.label }}
                    />
                }
                description={
                    <>
                        <ConnectCallSource />
                    </>
                }
            >
                <Column gap={12}>
                    <SubTabs activeItemId={selectedAccountType}>
                        {accountTypes?.map((type, index) => (
                            <SubTabs.Item
                                key={index}
                                id={type}
                                onClick={() => {
                                    setSelectedAccountType(type);
                                }}
                                data-testid={`@select-account-modal/subtab/${type}`}
                            >
                                {typeLabels[type]}
                            </SubTabs.Item>
                        ))}
                    </SubTabs>

                    <Card paddingType="none">
                        <Table
                            isRowHighlightedOnHover
                            colWidths={[{ width: 'auto' }, { width: '200px' }, { width: '80px' }]}
                        >
                            <Table.Header>
                                <Table.Row>
                                    <Table.Cell>
                                        <Translation id="TR_ACCOUNT" />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Translation id="TR_BALANCE" />
                                    </Table.Cell>
                                    <Table.Cell></Table.Cell>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {filteredAccounts?.map(account => {
                                    const symbol = data.coinInfo.shortcut.toLowerCase();
                                    const suiteAccount = suiteAccounts.find(
                                        a =>
                                            a.descriptor === account.descriptor &&
                                            a.symbol === symbol,
                                    );

                                    return (
                                        <Table.Row
                                            key={account.descriptor}
                                            onClick={() => confirm(account.index)}
                                            data-testid={`@select-account-modal/accounts/${account.type}/${account.index}`}
                                        >
                                            <Table.Cell>
                                                <Row gap={12}>
                                                    {isNetworkSymbolWithIcon(symbol) && (
                                                        <NetworkIcon
                                                            networkSymbol={symbol}
                                                            size={24}
                                                        />
                                                    )}
                                                    {suiteAccount ? (
                                                        <AccountLabel account={suiteAccount} />
                                                    ) : (
                                                        account.label
                                                    )}
                                                </Row>
                                            </Table.Cell>
                                            <Table.Cell>
                                                {account.empty ? (
                                                    <Translation id="TR_ACCOUNT_IS_EMPTY_TITLE" />
                                                ) : (
                                                    account.balance
                                                )}
                                            </Table.Cell>
                                            <Table.Cell align="end">
                                                <Icon size={24} as={CaretRightIcon} />
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                                {data.type !== 'end' && data.type !== 'complete' && (
                                    <Table.Row>
                                        <Table.Cell>
                                            <Skeleton width={100} animate />
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Skeleton width={80} animate />
                                        </Table.Cell>
                                        <Table.Cell align="end">
                                            <Skeleton type="circle" size={24} />
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>
                    </Card>
                </Column>
            </Modal.ModalBase>
        </ConnectModalBackdrop>
    );
};
