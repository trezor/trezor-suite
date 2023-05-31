import React from 'react';
import { ActionButton, ActionColumn, TextColumn, Row } from '@suite-components/Settings';
import { Translation } from '@suite-components';
import { useDispatch } from '@suite-hooks/useDispatch';
import { rescanCoinjoinAccount } from '@wallet-actions/coinjoinAccountActions';
import type { Account } from '@wallet-types';

type RescanAccountProps = {
    account: Extract<Account, { backendType: 'coinjoin' }>;
};

export const RescanAccount = ({ account }: RescanAccountProps) => {
    const dispatch = useDispatch();
    return (
        <Row>
            <TextColumn
                title={<Translation id="TR_COINJOIN_ACCOUNT_RESCAN_TITLE" />}
                description={<Translation id="TR_COINJOIN_ACCOUNT_RESCAN_DESCRIPTION" />}
            />
            <ActionColumn>
                <ActionButton
                    isDisabled={account.status === 'initial' || account.syncing}
                    onClick={() => dispatch(rescanCoinjoinAccount(account.key, true))}
                >
                    <Translation id="TR_COINJOIN_ACCOUNT_RESCAN_ACTION" />
                </ActionButton>
            </ActionColumn>
        </Row>
    );
};
