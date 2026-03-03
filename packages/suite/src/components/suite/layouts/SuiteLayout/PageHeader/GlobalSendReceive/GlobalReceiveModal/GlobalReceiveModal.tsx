import { useRef } from 'react';

import { events } from '@suite/analytics';
import { Translation } from '@suite/intl';
import { CardList, Column, IconCircle, Link, Modal, Paragraph, Row } from '@trezor/components';
import { HOW_TO_CHOOSE_RIGHT_NETWORK_URL } from '@trezor/urls';

import { openModal } from 'src/actions/suite/modalActions';
import { useModal } from 'src/components/suite/asset-picker/hooks/useModal';
import { AddAccountModal } from 'src/components/suite/modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountModal';
import { useDevice, useDiscovery, useDispatch, useSelector } from 'src/hooks/suite';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';
import { useAnalytics } from 'src/support/useAnalytics';
import { Account, AccountItemType } from 'src/types/wallet';

import { GlobalReceiveAccountListItem } from './components/GlobalReceiveAccountListItem';
import { useAccountsOptions } from './hooks/useAccountsOptions';
import { useFilterAccounts } from './hooks/useFilterAccounts';
import { AssetSearchWithNetworkFilter } from '../AssetSearchWithNetworkFilter/AssetSearchWithNetworkFilter';

type GlobalReceiveModalProps = {
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, type: AccountItemType, filledSearch: boolean) => void;
};

export const GlobalReceiveModal = ({ onCancel, onSubmit }: GlobalReceiveModalProps) => {
    const analytics = useAnalytics();
    const { device } = useDevice();
    const { isDiscoveryRunning } = useDiscovery();
    const isAddAccountDisabled = isDiscoveryRunning || !device || !device.connected;
    const accountModal = useModal(false);
    const dispatch = useDispatch();

    const listRef = useRef<HTMLDivElement>(null);
    const accountsOptions = useAccountsOptions();
    const filteredAccounts = useFilterAccounts(accountsOptions);
    const filledSearch = useSelector(globalSendReceiveFilters.selectors.filledSearch);

    return (
        <>
            <Modal
                heading={<Translation id="TR_RECEIVE" />}
                description={
                    <Translation
                        id="TR_RECEIVE_DESCRIPTION"
                        values={{
                            a: (...chunks) => (
                                <Link href={HOW_TO_CHOOSE_RIGHT_NETWORK_URL}>{chunks}</Link>
                            ),
                        }}
                    />
                }
                onCancel={() => onCancel(filledSearch)}
                width={480}
                maxHeight={640}
            >
                <Column gap={24}>
                    <AssetSearchWithNetworkFilter
                        placeholder="TR_RECEIVE_SEARCH"
                        listRef={listRef}
                        modal="receive"
                    />

                    <div ref={listRef}>
                        {filteredAccounts.length === 0 && (
                            <Paragraph
                                typographyStyle="body-md"
                                align="center"
                                margin={{ vertical: 32 }}
                            >
                                <Translation
                                    id={
                                        filledSearch
                                            ? 'TR_ACCOUNT_SEARCH_NO_RESULTS'
                                            : 'TR_ACCOUNT_NO_ACCOUNTS'
                                    }
                                />
                            </Paragraph>
                        )}

                        {(filteredAccounts.length > 0 || !isAddAccountDisabled) && (
                            <CardList>
                                {filteredAccounts.map(({ account }) => (
                                    <GlobalReceiveAccountListItem
                                        key={account.key}
                                        account={account}
                                        dataTestId={`@global-receive-account/${account.accountType}/${account.symbol}/${account.index}`}
                                        onClick={selectedAccount =>
                                            onSubmit(selectedAccount, 'coin', filledSearch)
                                        }
                                    />
                                ))}
                                {!isAddAccountDisabled && (
                                    <CardList.Item
                                        data-testid="@global-send-receive/add-account"
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
                                                type: events.dashboardReceiveModalOptionsEvent.name,
                                                payload: {
                                                    option: 'addAccount',
                                                    filledSearch,
                                                },
                                            });
                                        }}
                                    >
                                        <Row gap={12}>
                                            <IconCircle name="plus" size={40} intent="neutral" />
                                            <Translation id="TR_ADD_ACCOUNT" />
                                        </Row>
                                    </CardList.Item>
                                )}
                            </CardList>
                        )}
                    </div>
                </Column>
            </Modal>
            {accountModal.open && device && (
                <AddAccountModal
                    noRedirect
                    device={device}
                    onCancel={accountModal.closeModal}
                    onAddAccount={account => {
                        onSubmit(account, 'coin', filledSearch);
                    }}
                />
            )}
        </>
    );
};
