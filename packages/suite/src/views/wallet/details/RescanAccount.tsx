import { rescanCoinjoinAccountThunk } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { injectDispatch } from '@suite-common/redux-utils';
import { Button } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';

import type { Account } from 'src/types/wallet';

type RescanAccountProps = {
    account: Extract<Account, { backendType: 'coinjoin' }>;
};

export const RescanAccount = ({ account }: RescanAccountProps) => {
    const { dispatch } = useServices(injectDispatch);

    return (
        <Button
            isDisabled={account.status === 'initial' || account.syncing}
            onClick={() => dispatch(rescanCoinjoinAccountThunk(account.key, true))}
            minWidth={140}
        >
            <Translation id="TR_COINJOIN_ACCOUNT_RESCAN_ACTION" />
        </Button>
    );
};
