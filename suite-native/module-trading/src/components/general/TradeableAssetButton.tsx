import { Button, type ButtonProps, HStack } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { IconByCryptoId } from '@suite-native/trading-atoms';
import { type TradeableAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { NetworkSymbolExtendedFormatter } from './NetworkSymbolExtendedFormatter';

export type TradeableAssetButtonProps = Omit<ButtonProps, 'children' | 'style'> & {
    selectedAsset: TradeableAsset | undefined;
    caret?: boolean;
};

type SelectedTradeableAssetLabelProps = {
    selectedAsset: TradeableAsset;
    testID?: string;
};

const buttonStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp40,
}));

const SelectedTradeableAssetLabel = ({
    selectedAsset,
    testID,
}: SelectedTradeableAssetLabelProps) => {
    const { symbol, cryptoId } = selectedAsset;
    const symbolTestID = testID ? `${testID}/symbol` : undefined;

    return (
        <HStack alignItems="center" spacing="sp8">
            <IconByCryptoId
                tokenSymbol={symbol}
                cryptoId={cryptoId}
                size="extraSmall"
                withNetwork
            />
            <NetworkSymbolExtendedFormatter
                symbol={symbol}
                variant="body-sm-strong"
                color="contentPrimary"
                testID={symbolTestID}
            />
        </HStack>
    );
};

export const TradeableAssetButton = ({
    selectedAsset,
    caret,
    testID,
    ...buttonProps
}: TradeableAssetButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    const accessibilityLabel = translate('moduleTrading.selectCoin.buttonTitle');
    const iconRight = caret || !selectedAsset ? 'caretDown' : undefined;

    return (
        <Button
            size="medium"
            iconRight={iconRight}
            shouldWrapChildrenInText={!selectedAsset}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            testID={testID}
            style={applyStyle(buttonStyle)}
            intent="neutral"
            priority="secondary"
            {...buttonProps}
        >
            {selectedAsset ? (
                <SelectedTradeableAssetLabel selectedAsset={selectedAsset} testID={testID} />
            ) : (
                <Translation id="moduleTrading.selectCoin.buttonTitle" />
            )}
        </Button>
    );
};
