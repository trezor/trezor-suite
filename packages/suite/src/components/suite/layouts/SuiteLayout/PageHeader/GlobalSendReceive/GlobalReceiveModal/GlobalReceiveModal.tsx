import { useState } from 'react';

import { useTheme } from 'styled-components';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { Divider, Link, Row } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { spacings } from '@trezor/theme';
import { HELP_CENTER_VERIFY_TREZOR_SUITE_ADDRESSES_URL } from '@trezor/urls';

import {
    AssetRow,
    AssetSearchWithNetworkFilter,
    AssetsList,
    AssetsListEmpty,
    AssetsModal,
} from 'src/components/suite/asset-picker/components';
import { useModal } from 'src/components/suite/asset-picker/hooks/useModal';
import { AddAccountModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountModal';
import { AddAccountButton } from 'src/components/wallet/WalletLayout/AccountsMenu/AddAccountButton';
import { useDevice } from 'src/hooks/suite';
import { Account, AccountItemType } from 'src/types/wallet';

import { useAccountsOptions } from './hooks/useAccountsOptions';
import { useFilterAccounts } from './hooks/useFilterAccounts';

type GlobalReceiveModalProps = {
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, type: AccountItemType, filledSearch: boolean) => void;
};

export const GlobalReceiveModal = ({ onCancel, onSubmit }: GlobalReceiveModalProps) => {
    const { device } = useDevice();
    const acccountModal = useModal(false);

    const theme = useTheme();

    const [search, setSearch] = useState('');
    const [networkSymbol, setNetworkSymbol] = useState<NetworkSymbol | undefined>(undefined);
    const accountsOptions = useAccountsOptions();
    const filteredAccounts = useFilterAccounts(accountsOptions, { networkSymbol, search });

    return (
        <>
            <AssetsModal
                heading={{ id: 'TR_RECEIVE' }}
                description={{
                    id: 'TR_RECEIVE_DESCRIPTION',
                    values: {
                        a: (...chunks) => (
                            <Link
                                color={theme.textSubdued}
                                variant="underline"
                                target="_blank"
                                href={HELP_CENTER_VERIFY_TREZOR_SUITE_ADDRESSES_URL}
                            >
                                {chunks}
                            </Link>
                        ),
                    },
                }}
                onClose={() => onCancel(search.length > 0)}
            >
                <AssetSearchWithNetworkFilter
                    onNetworkFilter={setNetworkSymbol}
                    onSearch={setSearch}
                    placeholder="TR_RECEIVE_SEARCH"
                />

                <Divider />

                <AssetsListEmpty
                    isEmpty={filteredAccounts.accounts.length === 0}
                    heading={
                        search.length > 0
                            ? 'TR_ACCOUNT_SEARCH_NO_RESULTS'
                            : 'TR_ACCOUNT_NO_ACCOUNTS'
                    }
                    height={400}
                >
                    <AssetsList
                        items={filteredAccounts.accounts}
                        itemsFingerprint={filteredAccounts.fingerprint}
                        renderItem={item => (
                            <AssetRow
                                type="account"
                                data={item}
                                onClick={account => onSubmit(account, 'coin', search.length > 0)}
                            />
                        )}
                        height={400}
                    />
                </AssetsListEmpty>

                <Row justifyContent="center" margin={{ top: spacings.xs }}>
                    <AddAccountButton
                        data-testid="@global-send-receive/add-account"
                        device={device}
                        customModalOpen={() => {
                            acccountModal.openModal();

                            analytics.report({
                                type: EventType.DashboardReceiveModalOptions,
                                payload: {
                                    option: 'addAccount',
                                    filledSearch: search.length > 0,
                                },
                            });
                        }}
                        isFullWidth={false}
                        isIconOnly={false}
                    />
                </Row>
            </AssetsModal>
            {acccountModal.open && device && (
                <AddAccountModal
                    noRedirect
                    device={device}
                    onCancel={acccountModal.closeModal}
                    onAddAccount={account => {
                        onSubmit(account, 'coin', search.length > 0);
                    }}
                />
            )}
        </>
    );
};
