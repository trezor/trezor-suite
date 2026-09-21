import { Button, type ButtonColorProps, HStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { IconByCryptoId } from '@suite-native/trading-atoms';
import { type TradeableAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NetworkSymbolExtendedFormatter } from './NetworkSymbolExtendedFormatter';

export type TradeableAssetButtonProps = {
    onPress: () => void;
    selectedAsset: TradeableAsset | undefined;
    caret?: boolean;
    buttonColorProps?: ButtonColorProps;
    testID?: string;
};

const buttonStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp40,
}));

export const TradeableAssetButton = ({
    onPress,
    selectedAsset,
    caret,
    buttonColorProps = {
        intent: 'neutral',
        priority: 'secondary',
    },
    testID,
}: TradeableAssetButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const accessibilityLabel = translate('moduleTrading.selectCoin.buttonTitle');
    const symbolTestID = testID ? `${testID}/symbol` : undefined;
    const iconRight = caret || !selectedAsset ? 'caretDown' : undefined;

    return (
        <Button
            onPress={onPress}
            size="medium"
            iconRight={iconRight}
            shouldWrapChildrenInText={!selectedAsset}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            testID={testID}
            style={applyStyle(buttonStyle)}
            {...buttonColorProps}
        >
            {selectedAsset ? (
                <HStack alignItems="center" spacing="sp8">
                    <IconByCryptoId
                        cryptoId={selectedAsset.cryptoId}
                        size="extraSmall"
                        withNetwork
                    />
                    <NetworkSymbolExtendedFormatter
                        symbol={selectedAsset.symbol}
                        variant="body-sm-strong"
                        color="contentPrimary"
                        testID={symbolTestID}
                    />
                </HStack>
            ) : (
                <Translation id="moduleTrading.selectCoin.buttonTitle" />
            )}
        </Button>
    );
};
