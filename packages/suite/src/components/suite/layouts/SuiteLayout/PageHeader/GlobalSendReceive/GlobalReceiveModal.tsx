import { useState } from 'react';

import { Account } from '@suite-common/wallet-types';
import { EventType, analytics } from '@trezor/suite-analytics';

import { GlobalSendReceiveModalBase } from './GlobalSendReceiveModalBase';
import { useAccountSearch, useDevice } from '../../../../../../hooks/suite';
import { AccountItemType } from '../../../../../../types/wallet';
import { AddAccountButton } from '../../../../../wallet/WalletLayout/AccountsMenu/AddAccountButton';
import { Translation } from '../../../../Translation';
import { AddAccountModal } from '../../../../modals/ReduxModal/UserContextModal/AddAccountModal/AddAccountModal';

type GlobalReceiveModalProps = {
    onCancel: (filledSearch: boolean) => void;
    onSubmit: (account: Account, type: AccountItemType, filledSearch: boolean) => void;
};

export const GlobalReceiveModal = ({ onCancel, onSubmit }: GlobalReceiveModalProps) => {
    const { searchString } = useAccountSearch();
    const { device } = useDevice();
    const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);

    return (
        <>
            <GlobalSendReceiveModalBase
                heading={<Translation id="TR_RECEIVE" />}
                onCancel={onCancel}
                onSubmit={onSubmit}
                additionalAction={
                    <AddAccountButton
                        data-testid="@global-send-receive/add-account"
                        device={device}
                        customModalOpen={() => {
                            setAddAccountModalOpen(true);

                            analytics.report({
                                type: EventType.DashboardReceiveModalOptions,
                                payload: {
                                    option: 'addAccount',
                                    filledSearch: !!searchString,
                                },
                            });
                        }}
                        isFullWidth={false}
                        isIconOnly={false}
                    />
                }
            />
            {addAccountModalOpen && device && (
                <AddAccountModal
                    noRedirect
                    device={device}
                    onCancel={() => setAddAccountModalOpen(false)}
                    onAddAccount={account => {
                        onSubmit(account, 'coin', !!searchString);
                    }}
                />
            )}
        </>
    );
};
