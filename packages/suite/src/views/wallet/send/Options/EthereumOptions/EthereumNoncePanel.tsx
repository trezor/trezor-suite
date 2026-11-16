import { useEvmNonceInfo } from '@suite-common/wallet-core';
import { type Account, type AccountWithNetworkType } from '@suite-common/wallet-types';

import { useSendFormContext } from '#src/hooks/wallet';

import { EthereumNonce } from './EthereumNonce';
import type { NoncePanelProps } from '../sendOptions/sendOptionPanels';

const isEvmAccount = (account: Account): account is AccountWithNetworkType<'ethereum'> =>
    account.networkType === 'ethereum';

/**
 * The EVM nonce panel. The network states that a nonce can be set; what the next free one is,
 * and whether a nonce replaces a pending transaction, depends on the account's pending
 * transactions, which only the app knows.
 */
export const EthereumNoncePanel = ({ onCancel }: NoncePanelProps) => {
    const { account } = useSendFormContext();
    const evmAccount = isEvmAccount(account) ? account : undefined;
    // Fetched only while the panel is open, so it does not run on every account update; signing
    // checks the nonce again, but a stale suggestion here would mislead the user.
    const { nonceInfo } = useEvmNonceInfo(evmAccount, { enabled: evmAccount !== undefined });

    return (
        <EthereumNonce
            displayNonce={nonceInfo?.nextNonce.toString()}
            confirmedNonce={nonceInfo?.confirmedNonce.toString()}
            onCancel={onCancel}
        />
    );
};
