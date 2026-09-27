import { type NetworkSymbol } from '@suite-common/wallet-config';
import { DecorativeControl, Switch } from '@suite-native/atoms';
import { useFormContext, useWatch } from '@suite-native/forms';

import { NetworkListItem } from './NetworkListItem';
import { type CoinEnablingFormValues, getEnabledCoinFieldName } from '../coinEnablingFormUtils';

type NetworkSwitchListItemProps = {
    symbol: NetworkSymbol;
    onToggle: (symbol: NetworkSymbol, isEnabled: boolean) => void;
};

export const NetworkSwitchListItem = ({ symbol, onToggle }: NetworkSwitchListItemProps) => {
    const { control } = useFormContext<CoinEnablingFormValues>();
    const isEnabled = !!useWatch({
        control,
        name: getEnabledCoinFieldName(symbol),
    });

    const handleToggle = (nextIsEnabled: boolean) => onToggle(symbol, nextIsEnabled);

    return (
        <NetworkListItem
            symbol={symbol}
            accessory={
                <DecorativeControl>
                    <Switch onChange={handleToggle} isChecked={isEnabled} />
                </DecorativeControl>
            }
            onPress={() => handleToggle(!isEnabled)}
            accessibilityRole="switch"
            accessibilityState={{ checked: isEnabled }}
            testID={`@coin-enabling/toggle-${symbol}`}
        />
    );
};
