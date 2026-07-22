import { memo, useCallback } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Switch } from '@suite-native/atoms';
import { useFormContext, useWatch } from '@suite-native/forms';

import { type CoinEnablingFormValues, getEnabledCoinFieldName } from '../coinEnablingFormUtils';

type NetworkSymbolSwitchProps = {
    symbol: NetworkSymbol;
    onToggle: (symbol: NetworkSymbol, isEnabled: boolean) => void;
};

export const NetworkSymbolSwitch = memo(({ symbol, onToggle }: NetworkSymbolSwitchProps) => {
    const { control } = useFormContext<CoinEnablingFormValues>();
    const isEnabled = !!useWatch({
        control,
        name: getEnabledCoinFieldName(symbol),
    });
    const handleToggle = useCallback(
        (nextIsEnabled: boolean) => onToggle(symbol, nextIsEnabled),
        [onToggle, symbol],
    );

    return <Switch onChange={handleToggle} isChecked={isEnabled} />;
});
