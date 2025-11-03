import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { AccountsRootState } from '@suite-common/wallet-core';
import type { TradingRootState } from '@suite-native/trading-state';
import type { ReceiveAccount } from '@suite-native/trading-types';

// Lame version of `UseFormReturn<{receiveAccount: ReceiveAccount | undefined}>['setValue']`,
// but TS likes this one more.
type FormSetValue = (key: 'receiveAccount', value: ReceiveAccount | undefined) => void;

type ReceiveAccountSelector = (
    state: TradingRootState & AccountsRootState,
) => ReceiveAccount | undefined;

export const useReceiveAccountChangeEffect = (
    setValue: FormSetValue,
    selectReceiveAccount: ReceiveAccountSelector,
) => {
    const receiveAccount = useSelector(selectReceiveAccount);

    useEffect(() => {
        setValue('receiveAccount', receiveAccount);
    }, [receiveAccount, setValue]);
};
