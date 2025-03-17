import { useEffect } from 'react';

import { NetworkSymbol, NetworkType } from '@suite-common/wallet-config';
import { AccountsState, SendState, SerializedTx, StakeState } from '@suite-common/wallet-core';
import { Account, FormState, ReviewOutput } from '@suite-common/wallet-types';
import { findAccountsByAddress } from '@suite-common/wallet-utils';
import { StakeType } from '@trezor/blockchain-link-types';
import TrezorConnect from '@trezor/connect';

const getTxValidityTimeoutInMs = (networkType?: NetworkType) => {
    if (networkType === 'solana') {
        // Blockhash required in Solana tx is valid for 1 minute. Leave 15 seconds for tx confirmation.
        return 45 * 1000;
    }

    return 0;
};

const hasTxValidityExpired = (deadline: number) => deadline <= Date.now();

const shouldShowTxValidityTimer = (
    deadline: number,
    outputs: ReviewOutput[],
    symbol: NetworkSymbol,
    accounts: AccountsState,
    buttonRequestsCount: number,
    serializedTx: SerializedTx | undefined,
    stakeType: StakeType | null,
    shouldCheckTxTimeValidity: boolean,
) => {
    if (!shouldCheckTxTimeValidity || hasTxValidityExpired(deadline)) {
        return false;
    }

    const firstOutput = outputs[0];
    const isInternalTransfer =
        firstOutput?.type === 'address' &&
        findAccountsByAddress(symbol, firstOutput.value, accounts).length > 0;

    const isFirstStep = buttonRequestsCount <= 1;
    const isStaking = stakeType && !serializedTx;

    return isInternalTransfer || !isFirstStep || serializedTx || isStaking;
};

export const useTxValidityTimer = ({
    txInfoState,
    precomposedForm,
    account,
    isSending,
}: {
    txInfoState: SendState | StakeState;
    precomposedForm?: FormState;
    account?: Account;
    isSending: boolean;
}) => {
    const createdTxTimestamp = txInfoState?.precomposedTx?.createdTimestamp || 0;
    const deadline = createdTxTimestamp + getTxValidityTimeoutInMs(account?.networkType);
    const shouldCheckTxTimeValidity =
        account?.networkType === 'solana' && !precomposedForm?.isTrading;

    const isTxExpired = hasTxValidityExpired(deadline);

    // check if transaction is still valid
    useEffect(() => {
        if (!shouldCheckTxTimeValidity) {
            return;
        }

        const now = Date.now();
        const timeLeft = Math.max(deadline - now, 0);
        let mounted = true;

        const timeoutId = setTimeout(() => {
            if (mounted && !isSending) {
                TrezorConnect.cancel('tx-timeout');
            }
        }, timeLeft);

        return () => {
            mounted = false;
            clearTimeout(timeoutId);
        };
    }, [deadline, isSending, shouldCheckTxTimeValidity]);

    return {
        isTxExpired,
        shouldShowTxValidityTimer,
        shouldCheckTxTimeValidity,
        deadline,
    };
};
