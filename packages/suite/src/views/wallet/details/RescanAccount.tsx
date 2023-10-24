import { ActionButton, ActionColumn, TextColumn, Translation } from 'src/components/suite';
import { useDispatch } from 'src/hooks/suite/useDispatch';
import { rescanCoinjoinAccount } from 'src/actions/wallet/coinjoinAccountActions';
import type { Account } from 'src/types/wallet';
import { Row } from './Row';

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
