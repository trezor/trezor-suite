import { type UseFormReturn, useWatch } from '@suite-native/forms';

import { type CoinEnablingFormValues } from '../coinEnablingFormUtils';

export const useHasEnabledCoin = (control: UseFormReturn<CoinEnablingFormValues>['control']) =>
    useWatch({
        control,
        name: 'enabledCoins',
        defaultValue: {},
        compute: (enabledCoins: CoinEnablingFormValues['enabledCoins']) =>
            Object.values(enabledCoins ?? {}).some(Boolean),
    });
