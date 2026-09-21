import { Button, type ButtonColorProps } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { type TradeableAsset } from '@suite-native/trading-types';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { TradeableAssetButton } from './TradeableAssetButton';

export type SelectTradeableAssetButtonProps = {
    onPress: () => void;
    selectedAsset: TradeableAsset | undefined;
    caret?: boolean;
    buttonColorProps?: ButtonColorProps;
    testID?: string;
};

const buttonStyle = prepareNativeStyle(({ spacings }) => ({
    height: spacings.sp40,
}));

export const SelectTradeableAssetButton = ({
    onPress,
    selectedAsset,
    caret,
    buttonColorProps = {
        intent: 'neutral',
        priority: 'secondary',
    },
    testID,
}: SelectTradeableAssetButtonProps) => {
    const { applyStyle } = useNativeStyles();
    const { translate } = useTranslate();

    if (selectedAsset) {
        return (
            <TradeableAssetButton
                asset={selectedAsset}
                onPress={onPress}
                accessibilityLabel={translate('moduleTrading.selectCoin.buttonTitle')}
                caret={caret}
                testID={testID}
                {...buttonColorProps}
            />
        );
    }

    return (
        <Button
            onPress={onPress}
            iconRight="caretDown"
            accessibilityLabel={translate('moduleTrading.selectCoin.buttonTitle')}
            size="medium"
            testID={testID}
            style={applyStyle(buttonStyle)}
            {...buttonColorProps}
        >
            <Translation id="moduleTrading.selectCoin.buttonTitle" />
        </Button>
    );
};
