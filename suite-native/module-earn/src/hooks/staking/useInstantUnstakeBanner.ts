import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import {
    type AccountsRootState,
    type StakeRootState,
    type TransactionsRootState,
    getChangedInternalTx,
    getInstantStakeType,
    isSupportedEthStakingNetworkSymbol,
    selectAccountByKey,
    selectAccountTransactions,
    selectUnstakingPeriodInDaysBySymbol,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';

type InstantUnstakeBannerData = {
    amount: string;
    displaySymbol: string;
    unstakingPeriodInDays: number | undefined;
    dismiss: () => void;
};

export const useInstantUnstakeBanner = (
    accountKey: AccountKey,
): InstantUnstakeBannerData | null => {
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );
    const txs = useSelector((state: TransactionsRootState) =>
        selectAccountTransactions(state, accountKey),
    );
    const descriptor = account?.descriptor;
    const symbol = account?.symbol;

    const unstakingPeriodInDays = useSelector((state: StakeRootState) =>
        selectUnstakingPeriodInDaysBySymbol(state, symbol ?? undefined),
    );

    const [amount, setAmount] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const prevTxs = useRef(txs);

    useEffect(() => {
        if (!descriptor || !symbol || !isSupportedEthStakingNetworkSymbol(symbol)) {
            prevTxs.current = txs;

            return;
        }

        const transfer = getChangedInternalTx(prevTxs.current, txs, descriptor, symbol);
        if (transfer && getInstantStakeType(transfer, descriptor, symbol) === 'unstake') {
            setAmount(formatNetworkAmount(transfer.amount ?? '0', symbol, false));
            setIsVisible(true);
        }

        prevTxs.current = txs;
    }, [txs, descriptor, symbol]);

    const dismiss = useCallback(() => setIsVisible(false), []);

    if (!isVisible || amount === null || !symbol) return null;

    return {
        amount,
        displaySymbol: getNetworkDisplaySymbol(symbol),
        unstakingPeriodInDays,
        dismiss,
    };
};
