import { Pressable } from 'react-native';

import { type FiatCurrencyCode } from 'invity-api';

import { Box } from '@suite-native/atoms';
import { TradingAsset } from '@suite-native/trading-atoms';

export type FiatCurrencyListItemProps = {
    displayValue: string;
    label: string;
    value: FiatCurrencyCode;
    onPress: () => void;
};

export const FiatCurrencyListItem = ({
    displayValue,
    onPress,
    label,
    value,
}: FiatCurrencyListItemProps) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        <Box paddingVertical="sp12">
            <TradingAsset
                assetType="fiat"
                fiatCurrency={value}
                iconSize="small"
                name={label}
                spacing="sp12"
                symbol={displayValue}
            />
        </Box>
    </Pressable>
);
