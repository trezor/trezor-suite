import { useCallback, useRef } from 'react';

import { Divider, Link, Modal } from '@trezor/components';
import { EventType, analytics } from '@trezor/suite-analytics';
import { HOW_TO_CHOOSE_RIGHT_NETWORK_URL } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import { Translation } from 'src/components/suite/Translation';
import {
    AssetRowReceiveToAccount,
    AssetsList,
    AssetsListEmpty,
    AssetsModal,
} from 'src/components/suite/asset-picker/components';
import { useDataFingerprint } from 'src/components/suite/asset-picker/hooks/useDataFingerprint';
import { useModal } from 'src/components/suite/asset-picker/hooks/useModal';
import { AddAccountModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountModal';
import { useDevice, useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';
import { Account, AccountItemType } from 'src/types/wallet';

import { useAccountsOptions } from './hooks/useAccountsOptions';
import { FilteredAccountOption, useFilterAccounts } from './hooks/useFilterAccounts';
import { AssetSearchWithNetworkFilter } from '../AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter';

type GlobalReceiveModalProps = {
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, type: AccountItemType, filledSearch: boolean) => void;
};

const LIST_HEIGHT = 385;

export const GlobalReceiveModal = ({ onCancel, onSubmit }: GlobalReceiveModalProps) => {
    const { device } = useDevice();
    const { isDiscoveryRunning } = useDiscovery();
    const isAddAccountDisabled = isDiscoveryRunning || !device || !device.connected;
    const acccountModal = useModal(false);
    const dispatch = useDispatch();

    const listRef = useRef<HTMLDivElement>(null);
    const accountsOptions = useAccountsOptions();
    const filteredAccounts = useFilterAccounts(accountsOptions);
    const filteredAccountsFingerprint = useDataFingerprint(filteredAccounts);
    const filledSearch = useSelector(globalSendReceiveFilters.selectors.filledSearch);

    const renderItem = useCallback(
        (item: FilteredAccountOption) => (
            <AssetRowReceiveToAccount
                account={item.account}
                onClick={account => onSubmit(account, 'coin', filledSearch)}
            />
        ),
        [onSubmit, filledSearch],
    );

    return (
        <>
            <AssetsModal
                heading={{ id: 'TR_RECEIVE' }}
                description={{
                    id: 'TR_RECEIVE_DESCRIPTION',
                    values: {
                        a: (...chunks) => (
                            <Link href={HOW_TO_CHOOSE_RIGHT_NETWORK_URL}>{chunks}</Link>
                        ),
                    },
                }}
                onClose={() => onCancel(filledSearch)}
                bottomContent={
                    <Modal.Button
                        data-testid="@global-send-receive/add-account"
                        intent="neutral"
                        priority="secondary"
                        isDisabled={isAddAccountDisabled}
                        onClick={() => {
                            if (!device) {
                                return;
                            }

                            dispatch(
                                openModal({
                                    type: 'add-account',
                                    device,
                                }),
                            );

                            analytics.report({
                                type: EventType.DashboardReceiveModalOptions,
                                payload: {
                                    option: 'addAccount',
                                    filledSearch,
                                },
                            });
                        }}
                    >
                        <Translation id="TR_ADD_ACCOUNT" />
                    </Modal.Button>
                }
            >
                <AssetSearchWithNetworkFilter
                    placeholder="TR_RECEIVE_SEARCH"
                    listRef={listRef}
                    modal="receive"
                />

                <Divider margin={{ top: 16 }} />

                <AssetsListEmpty
                    isEmpty={filteredAccounts.length === 0}
                    heading={
                        filledSearch ? 'TR_ACCOUNT_SEARCH_NO_RESULTS' : 'TR_ACCOUNT_NO_ACCOUNTS'
                    }
                    height={LIST_HEIGHT}
                >
                    <AssetsList
                        items={filteredAccounts}
                        itemsFingerprint={filteredAccountsFingerprint}
                        renderItem={renderItem}
                        height={LIST_HEIGHT}
                        ref={listRef}
                    />
                </AssetsListEmpty>
            </AssetsModal>
            {acccountModal.open && device && (
                <AddAccountModal
                    noRedirect
                    device={device}
                    onCancel={acccountModal.closeModal}
                    onAddAccount={account => {
                        onSubmit(account, 'coin', filledSearch);
                    }}
                />
            )}
        </>
    );
};
