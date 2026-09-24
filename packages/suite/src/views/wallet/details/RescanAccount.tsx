import { rescanCoinjoinAccountThunk } from '@suite/coinjoin';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { SectionItem } from '@trezor/product-components';

import type { Account } from 'src/types/wallet';

type RescanAccountProps = {
    account: Extract<Account, { backendType: 'coinjoin' }>;
};

export const RescanAccount = ({ account }: RescanAccountProps) => {
    const { dispatch } = useServices(injectDispatch);

    return (
        <SectionItem
            title={<Translation id="TR_COINJOIN_ACCOUNT_RESCAN_TITLE" />}
            description={<Translation id="TR_COINJOIN_ACCOUNT_RESCAN_DESCRIPTION" />}
            actions={
                <SectionItem.Button
                    isDisabled={account.status === 'initial' || account.syncing}
                    onClick={() => dispatch(rescanCoinjoinAccountThunk(account.key, true))}
                >
                    <Translation id="TR_COINJOIN_ACCOUNT_RESCAN_ACTION" />
                </SectionItem.Button>
            }
        />
    );
};
