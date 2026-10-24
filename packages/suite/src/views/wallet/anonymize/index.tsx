import { useEffect } from 'react';

import { selectFullSelectedAccount } from '@suite/account';
import { selectIsMixingEnabledByAccountKey } from '@suite/coinjoin';
import { gotoThunk } from '@suite/router';
import { Column } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { WalletLayout, WalletSubpageHeading } from 'src/components/wallet';
import { useSelector } from 'src/hooks/suite';
import { CoinjoinConfirmation } from 'src/views/wallet/anonymize/components/CoinjoinConfirmation';

const Anonymize = () => {
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const isMixingEnabled = useSelector(state =>
        selectIsMixingEnabledByAccountKey(state, selectedAccount.account?.key ?? null),
    );

    const { dispatch } = useServices(injectDispatch);

    // The anonymize flow belongs to the mixing surface, so it is only reachable while a coordinator
    // URL override is present for the account's network.
    useEffect(() => {
        if (selectedAccount.status === 'loaded' && !isMixingEnabled) {
            dispatch(gotoThunk({ routeName: 'wallet-index', preserveParams: true }));
        }
    }, [selectedAccount.status, isMixingEnabled, dispatch]);

    return (
        <WalletLayout title="TR_NAV_ANONYMIZE" isSubpage account={selectedAccount}>
            {selectedAccount.status === 'loaded' && isMixingEnabled && (
                <Column gap={24}>
                    <WalletSubpageHeading title="TR_NAV_ANONYMIZE" />
                    <CoinjoinConfirmation account={selectedAccount.account} />
                </Column>
            )}
        </WalletLayout>
    );
};

export default Anonymize;
