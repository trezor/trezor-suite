import { Button, type ButtonColorProps } from '@suite-native/atoms';
import { Translation, useTranslate } from '@suite-native/intl';
import { type TradeableAsset } from '@suite-native/trading-types';

import { TradeableAssetButton } from './TradeableAssetButton';

export type SelectAssetButtonProps = {
    onPress: () => void;
    selectedAsset: TradeableAsset | undefined;
    caret?: boolean;
    buttonColorProps?: ButtonColorProps;
    testID?: string;
};

export const SelectTradeableAssetButton = ({
    onPress,
    selectedAsset,
    caret,
    buttonColorProps = {
        intent: 'brand',
        priority: 'primary',
    },
    testID,
}: SelectAssetButtonProps) => {
    const { translate } = useTranslate();

    if (selectedAsset) {
        return (
            <TradeableAssetButton
                asset={selectedAsset}
                onPress={onPress}
                accessibilityLabel={translate('moduleTrading.selectCoin.buttonTitle')}
                caret={caret}
                testID={testID}
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
            {...buttonColorProps}
        >
            <Translation id="moduleTrading.selectCoin.buttonTitle" />
        </Button>
    );
};
