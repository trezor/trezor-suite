import React from 'react';
import { Button } from '@trezor/components';
import { AccountExceptionLayout } from 'src/components/wallet';
import { Translation } from 'src/components/suite';
import * as modalActions from 'src/actions/suite/modalActions';
import { useActions, useSelector } from 'src/hooks/suite';

export const NoTokens = () => {
    const { selectedAccount } = useSelector(state => ({
        selectedAccount: state.wallet.selectedAccount,
    }));

    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    if (selectedAccount.status !== 'loaded') return null;

    const { account } = selectedAccount;

    const addButton = (
        <Button
            variant="primary"
            onClick={() => {
                openModal({ type: 'add-token' });
            }}
        >
            <Translation id="TR_TOKENS_ADD" />
        </Button>
    );

    return (
        <AccountExceptionLayout
            title={<Translation id="TR_TOKENS_EMPTY" />}
            image="CLOUDY"
            actionComponent={account.networkType !== 'cardano' ? addButton : undefined}
        />
    );
};
