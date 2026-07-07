import { Pressable } from 'react-native';

import { Box, buttonSizeToDimensionsMap } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { IconByCryptoId } from '@suite-native/trading-atoms';
import { type TradeableAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NetworkSymbolExtendedFormatter } from './NetworkSymbolExtendedFormatter';

export type TradeableAssetButtonProps = {
    asset: TradeableAsset;
    caret?: boolean;
    onPress: () => void;
    accessibilityLabel: string;
    testID?: string;
};

const buttonStyle = prepareNativeStyle(({ borders, colors, spacings }) => ({
    ...buttonSizeToDimensionsMap.medium,
    gap: spacings.sp8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.elementFillNeutralSofter,
    borderColor: colors.elementBorderNeutralSofter,
    borderWidth: borders.widths.small,
}));

export const TradeableAssetButton = ({
    asset: { symbol, cryptoId },
    caret,
    onPress,
    accessibilityLabel,
    testID,
}: TradeableAssetButtonProps) => {
    const { applyStyle } = useNativeStyles();

    const symbolTestID = testID ? `${testID}/symbol` : undefined;

    return (
        <Pressable
            onPress={onPress}
            style={applyStyle(buttonStyle)}
            accessible
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            testID={testID}
        >
            <IconByCryptoId cryptoId={cryptoId} size="tiny" />
            <NetworkSymbolExtendedFormatter
                symbol={symbol}
                variant="body-sm-strong"
                color="contentPrimary"
                testID={symbolTestID}
            />
            {caret ? <Icon name="caretDown" color="contentPrimary" size="medium" /> : <Box />}
        </Pressable>
    );
};
