import { useMemo } from 'react';

import { Account } from '@suite-common/wallet-types';
import { getExcludedUtxos, GetExcludedUtxosProps } from '@suite-common/wallet-utils';

interface UseExcludedUtxosProps extends GetExcludedUtxosProps {
    account: Account;
}

/**
 * Shareable sub-hook used in useSendForm and useRbfForm
 * Returns utxos which should be automatically excluded while composingTransaction.
 * Response format: { utxo_outpoint: exclusion_reason }
 */
export const useExcludedUtxos = ({
    account,
    dustLimit,
    targetAnonymity,
    prison,
}: UseExcludedUtxosProps) =>
    useMemo(
        () =>
            getExcludedUtxos({
                utxos: account.utxo,
                anonymitySet: account.addresses?.anonymitySet,
                dustLimit,
                targetAnonymity,
                prison,
            }),
        [account.utxo, account.addresses?.anonymitySet, dustLimit, targetAnonymity, prison],
    );
