import { Button, type ButtonColorProps, HStack } from '@suite-native/atoms';
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
} & ButtonColorProps;

const buttonStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp40,
}));

export const TradeableAssetButton = ({
    asset: { symbol, cryptoId },
    caret,
    onPress,
    accessibilityLabel,
    testID,
    intent = 'neutral',
    priority = 'secondary',
    isInverse,
}: TradeableAssetButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const symbolTestID = testID ? `${testID}/symbol` : undefined;

    return (
        <Button
            onPress={onPress}
            size="medium"
            intent={intent}
            priority={priority}
            isInverse={isInverse}
            iconRight={caret ? 'caretDown' : undefined}
            shouldWrapChildrenInText={false}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            testID={testID}
            style={applyStyle(buttonStyle)}
        >
            <HStack alignItems="center" spacing="sp8">
                <IconByCryptoId cryptoId={cryptoId} size="extraSmall" withNetwork />
                <NetworkSymbolExtendedFormatter
                    symbol={symbol}
                    variant="body-sm-strong"
                    color="contentPrimary"
                    testID={symbolTestID}
                />
            </HStack>
        </Button>
    );
};
