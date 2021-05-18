import React from 'react';
import { Button } from '@trezor/components';
import { AccountExceptionLayout } from '@wallet-components';
import { Translation } from '@suite-components';
import * as modalActions from '@suite-actions/modalActions';
import { useActions } from '@suite-hooks';

const NoTokens = () => {
    const { openModal } = useActions({
        openModal: modalActions.openModal,
    });
    return (
        <AccountExceptionLayout
            title={<Translation id="TR_TOKENS_EMPTY" />}
            image="EMPTY_WALLET_NEUE"
            actionComponent={
                <Button
                    variant="primary"
                    onClick={() => {
                        openModal({ type: 'add-token' });
                    }}
                >
                    <Translation id="TR_TOKENS_ADD" />
                </Button>
            }
        />
    );
};

export default NoTokens;
