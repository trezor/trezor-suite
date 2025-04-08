import { useEffect, useState } from 'react';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { selectAccounts } from '@suite-common/wallet-core';
import {
    Card,
    Column,
    Icon,
    NewModal,
    Row,
    SkeletonCircle,
    SkeletonRectangle,
    SubTabs,
    Table,
} from '@trezor/components';
import { UiRequestSelectAccount } from '@trezor/connect';
import { CoinLogo } from '@trezor/product-components';
import { NETWORK_ICONS } from '@trezor/product-components/src/components/CoinLogo/networks';
import { spacings } from '@trezor/theme';

import { onReceiveAccount } from 'src/actions/suite/modalActions';
import { AccountLabel } from 'src/components/suite/AccountLabel';
import { ConnectCallSource } from 'src/components/suite/ConnectCallSource';
import { Translation } from 'src/components/suite/Translation';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';

interface SelectAccountModalProps {
    data: UiRequestSelectAccount['payload'];
}

export const SelectAccountModal = ({ data }: SelectAccountModalProps) => {
    const dispatch = useDispatch();
    const suiteAccounts = useSelector(selectAccounts);
    const suiteAccountLabels = useSelector(selectAccountLabels);

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
        p2wpkh: <Translation id="TR_NORMAL_ACCOUNTS" />,
        p2tr: <Translation id="TR_TAPROOT_ACCOUNTS" />,
        p2sh: <Translation id="TR_LEGACY_SEGWIT_ACCOUNTS" />,
        p2pkh: <Translation id="TR_LEGACY_ACCOUNTS" />,
    };
    const filteredAccounts = accounts?.filter(account => account.type === selectedAccountType);

    return (
        <NewModal
            onCancel={close}
            variant="primary"
            heading={
                <Translation id="TR_SELECT_ACCOUNT" values={{ networkName: data.coinInfo.label }} />
            }
            description={
                <>
                    <ConnectCallSource />
                </>
            }
        >
            <Column gap={spacings.sm}>
                <SubTabs activeItemId={selectedAccountType}>
                    {accountTypes?.map((type, index) => (
                        <SubTabs.Item
                            key={index}
                            id={type}
                            onClick={() => {
                                setSelectedAccountType(type);
                            }}
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
                            {filteredAccounts?.map((account, index) => {
                                const symbol = data.coinInfo.shortcut.toLowerCase();
                                const suiteAccount = suiteAccounts.find(
                                    a => a.descriptor === account.descriptor && a.symbol === symbol,
                                );

                                return (
                                    <Table.Row
                                        key={account.descriptor}
                                        onClick={() => confirm(index)}
                                    >
                                        <Table.Cell>
                                            <Row gap={spacings.sm}>
                                                {symbol in NETWORK_ICONS && (
                                                    <CoinLogo
                                                        type="network"
                                                        symbol={symbol as NetworkSymbol}
                                                        size={24}
                                                    />
                                                )}
                                                {suiteAccount ? (
                                                    <AccountLabel
                                                        accountLabel={
                                                            suiteAccountLabels[suiteAccount.key]
                                                        }
                                                        accountType={suiteAccount.accountType}
                                                        symbol={suiteAccount.symbol}
                                                        index={suiteAccount.index}
                                                    />
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
                                            <Icon size="large" name="chevronRight" />
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })}
                            {data.type !== 'end' && (
                                <Table.Row>
                                    <Table.Cell>
                                        <SkeletonRectangle width="100px" animate />
                                    </Table.Cell>
                                    <Table.Cell>
                                        <SkeletonRectangle width="80px" animate />
                                    </Table.Cell>
                                    <Table.Cell align="end">
                                        <SkeletonCircle size="24px" />
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </Card>
            </Column>
        </NewModal>
    );
};
