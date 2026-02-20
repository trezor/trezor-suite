import { useEffect } from 'react';

import { EarnAccountRef } from '@suite-common/suite-types/src/staking';
import { getNetwork } from '@suite-common/wallet-config';
import { Account, SelectedAccountLoaded } from '@suite-common/wallet-types';

import { EarnClaimModalLoaded } from './EarnClaimModalLoaded';
import { useEarnModalAccount } from '../common/useEarnModalAccount';

type EarnClaimModalProps = {
    onCancel?: () => void;
    account?: EarnAccountRef;
};

const createLoadedSelectedAccount = (account: Account): SelectedAccountLoaded => ({
    status: 'loaded',
    account,
    network: getNetwork(account.symbol),
    params: {
        symbol: account.symbol,
        accountIndex: account.index,
        accountType: account.accountType,
    },
});

export const EarnClaimModal = ({ onCancel, account }: EarnClaimModalProps) => {
    const selectedAccount = useEarnModalAccount({
        account,
        shouldSyncSelectedAccount: true,
    });

    useEffect(() => {
        if (!selectedAccount) {
            onCancel?.();
        }
    }, [selectedAccount, onCancel]);

    if (!selectedAccount) {
        return null;
    }

    const loadedSelectedAccount = createLoadedSelectedAccount(selectedAccount);

    return <EarnClaimModalLoaded onCancel={onCancel} selectedAccount={loadedSelectedAccount} />;
};
