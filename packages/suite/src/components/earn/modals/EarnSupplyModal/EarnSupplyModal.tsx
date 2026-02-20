import { useEffect } from 'react';

import { EarnAccountRef, EarnFlow } from '@suite-common/suite-types/src/staking';
import { getNetwork } from '@suite-common/wallet-config';
import { Account, SelectedAccountLoaded } from '@suite-common/wallet-types';

import { EarnStakingSupplyModalLoaded } from './EarnStakingSupplyModalLoaded';
import { EarnYieldSupplyModalLoaded } from './EarnYieldSupplyModalLoaded';
import { useEarnModalAccount } from '../common/useEarnModalAccount';

type EarnSupplyModalProps = {
    onCancel?: () => void;
    flow: EarnFlow;
    account?: EarnAccountRef;
    yieldId?: string;
    tokenContractAddress?: string;
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

export const EarnSupplyModal = ({
    onCancel,
    flow,
    account,
    // TODO: Use `yieldId` to preselect a specific Yield opportunity in Supply flow.
    yieldId: _yieldId,
    tokenContractAddress,
}: EarnSupplyModalProps) => {
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

    if (flow === EarnFlow.Yield) {
        return (
            <EarnYieldSupplyModalLoaded
                onCancel={onCancel}
                selectedAccount={loadedSelectedAccount}
                tokenContractAddress={tokenContractAddress}
            />
        );
    }

    return (
        <EarnStakingSupplyModalLoaded
            onCancel={onCancel}
            selectedAccount={loadedSelectedAccount}
            flow={flow}
        />
    );
};
