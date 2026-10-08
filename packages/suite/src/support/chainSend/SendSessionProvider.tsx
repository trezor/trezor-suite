import { type ReactNode, useEffect, useMemo, useState } from 'react';

import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { selectAccountTransactions } from '@suite-common/wallet-core';
import { isPending, isRbfTransaction } from '@suite-common/wallet-utils';

import { replaceByFeeErrorThunk } from 'src/actions/wallet/send/replaceByFeeErrorThunk';
import { useSelector } from 'src/hooks/suite';

import { type SendSession, SendSessionContext } from './SendSessionContext';

/**
 * A replacement cannot be broadcast once the transaction it replaces is mined. The wallet's own
 * sync keeps running beside the chain networks, so its transactions say when that happens.
 */
const useReplacedTransactionMinedGuard = (session: SendSession | undefined) => {
    const { dispatch } = useServices(injectDispatch);
    // Only a wallet account's send replaces transactions; a runtime network's never does.
    const walletSession = session?.kind === 'wallet' ? session : undefined;
    const prevTxid =
        walletSession && isRbfTransaction(walletSession.precomposedTx)
            ? walletSession.precomposedTx.prevTxid
            : undefined;
    const isReplacedTransactionMined = useSelector(
        state =>
            !!walletSession &&
            !!prevTxid &&
            selectAccountTransactions(state, walletSession.accountKey).some(
                transaction => transaction.txid === prevTxid && !isPending(transaction),
            ),
    );

    useEffect(() => {
        if (isReplacedTransactionMined) dispatch(replaceByFeeErrorThunk());
    }, [dispatch, isReplacedTransactionMined]);
};

type SendSessionProviderProps = { children: ReactNode };

/** Holds the transaction being signed and broadcast through its chain network for the modals. */
export const SendSessionProvider = ({ children }: SendSessionProviderProps) => {
    const [session, setSession] = useState<SendSession>();
    const value = useMemo(() => ({ session, setSession }), [session]);

    useReplacedTransactionMinedGuard(session);

    return <SendSessionContext.Provider value={value}>{children}</SendSessionContext.Provider>;
};
