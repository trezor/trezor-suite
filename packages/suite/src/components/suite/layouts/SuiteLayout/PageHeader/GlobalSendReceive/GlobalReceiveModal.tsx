import { useState } from 'react';

import { Account } from '@suite-common/wallet-types';

import { GlobalSendReceiveModalBase } from './GlobalSendReceiveModalBase';
import { useDevice } from '../../../../../../hooks/suite';
import { LocalAccountSearchProvider } from '../../../../../../hooks/suite/useAccountSearch';
import { AccountItemType } from '../../../../../../types/wallet';
import { AddAccountButton } from '../../../../../wallet/WalletLayout/AccountsMenu/AddAccountButton';
import { Translation } from '../../../../Translation';
import { AddAccountModal } from '../../../../modals';

type GlobalReceiveModalProps = {
    onCancel: () => void;
    onSubmit: (account: Account, type: AccountItemType) => void;
};

export const GlobalReceiveModal = ({ onCancel, onSubmit }: GlobalReceiveModalProps) => {
    const { device } = useDevice();
    const [addAccountModalOpen, setAddAccountModalOpen] = useState(false);

    return (
        <LocalAccountSearchProvider>
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
                            onSubmit(account, 'coin');
                        }}
                    />
                )}
            </>
        </LocalAccountSearchProvider>
    );
};
