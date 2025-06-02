import { useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';

import { selectVisibleSortedDeviceAccounts } from '@suite-common/wallet-core';
import { Account } from '@suite-common/wallet-types';
import {
    getSessionNetworks,
    selectSessions,
    switchSelectedAccountThunk,
    walletConnectActions,
} from '@suite-common/walletconnect';
import { Column, Modal, Option, Row, Select } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import * as modalActions from 'src/actions/suite/modalActions';
import { AccountLabel, Translation } from 'src/components/suite';
import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { useSelector } from 'src/hooks/suite';
import { selectAccountLabels } from 'src/reducers/suite/metadataReducer';

interface WalletConnectSwitchAccountModalProps {
    sessionTopic: string;
}

export const WalletConnectSwitchAccountModal = ({
    sessionTopic,
}: WalletConnectSwitchAccountModalProps) => {
    const dispatch = useDispatch();
    const sessions = useSelector(selectSessions);
    const session = sessions.find(s => s.topic === sessionTopic);
    const accounts = useSelector(selectVisibleSortedDeviceAccounts);
    const accountLabels = useSelector(selectAccountLabels);
    const selectableAccounts = useMemo<Account[]>(
        () =>
            session
                ? getSessionNetworks(session)
                      .filter(network => network.status === 'active')
                      .flatMap(network =>
                          accounts.filter(account => account.symbol === network.symbol),
                      )
                : [],
        [accounts, session],
    );
    const [selectedDefaultAccount, setSelectedDefaultAccount] = useState<Account | null>(
        session?.lastAccount || selectableAccounts[0] || null,
    );

    const handleSwitch = () => {
        if (selectedDefaultAccount && session) {
            dispatch(switchSelectedAccountThunk({ account: selectedDefaultAccount, sessionTopic }));
            dispatch(
                walletConnectActions.saveSession({
                    ...session,
                    lastAccount: selectedDefaultAccount,
                }),
            );
        }
        dispatch(modalActions.onCancel());
    };
    const handleCancel = () => {
        dispatch(modalActions.onCancel());
    };

    return (
        <Modal
            bottomContent={
                <>
                    <Modal.Button variant="primary" onClick={handleSwitch}>
                        <Translation id="TR_CONFIRM" />
                    </Modal.Button>
                </>
            }
            heading={<Translation id="TR_SWITCH_ACCOUNT" />}
            onCancel={handleCancel}
        >
            <Column gap={spacings.xs}>
                <Select
                    isSearchable={false}
                    isClearable={false}
                    size="large"
                    value={selectedDefaultAccount}
                    options={selectableAccounts}
                    formatOptionLabel={(account: Account) => (
                        <Row gap={spacings.xs}>
                            {account.symbol && (
                                <CoinLogo type="token" symbol={account.symbol} size={24} />
                            )}
                            <AccountLabel
                                key={account.descriptor}
                                accountLabel={accountLabels[account.key]}
                                accountType={account.accountType}
                                networkType={account.networkType}
                                symbol={account.symbol}
                                index={account.index}
                                path={account.path}
                            />
                            <AccountTypeBadge
                                accountType={account.accountType}
                                networkType={account.networkType}
                                size="small"
                                onElevation
                            />
                        </Row>
                    )}
                    onChange={(option: Option) => setSelectedDefaultAccount(option)}
                />
            </Column>
        </Modal>
    );
};
