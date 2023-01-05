import { useMemo } from 'react';

import { Account } from '@suite-common/wallet-types';
import { getExcludedUtxos } from '@suite-common/wallet-utils';

interface UseExcludedUtxosProps {
    account: Account;
    dustLimit?: number;
    targetAnonymity?: number;
}

/**
 * Shareable sub-hook used in useSendForm and useRbfForm
 * Returns utxos which should be automatically excluded while composingTransaction.
 * Response format: { utxo_outpoint: exclusion_reason }
 */
export const useExcludedUtxos = ({ account, dustLimit, targetAnonymity }: UseExcludedUtxosProps) =>
    useMemo(
        () =>
            getExcludedUtxos({
                utxos: account.utxo,
                anonymitySet: account.addresses?.anonymitySet,
                dustLimit,
                targetAnonymity,
            }),
        [account.utxo, account.addresses?.anonymitySet, dustLimit, targetAnonymity],
    );
