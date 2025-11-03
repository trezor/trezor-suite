import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import type { AccountsRootState } from '@suite-common/wallet-core';
import type { Account } from '@suite-common/wallet-types';
import type { TradingRootState } from '@suite-native/trading-state';
import type { FormWithSendAccountValues } from '@suite-native/trading-types';

// Lame version of `UseFormReturn<FormWithSendAssetValues>['setValue']`, but TS likes this one more.
type FormSetValue = ((
    key: 'sendAccount',
    value: FormWithSendAccountValues['sendAccount'],
) => void) &
    ((key: 'sendAsset', value: FormWithSendAccountValues['sendAsset']) => void);

type SendAccountSelector = (state: TradingRootState & AccountsRootState) => Account | undefined;

export const useSendAccountChangeEffect = (
    setValue: FormSetValue,
    selectSendAccount: SendAccountSelector,
) => {
    const sendAccount = useSelector(selectSendAccount);

    useEffect(() => {
        setValue('sendAccount', sendAccount);
        if (!sendAccount) {
            setValue('sendAsset', undefined);
        }
    }, [sendAccount, setValue]);
};
