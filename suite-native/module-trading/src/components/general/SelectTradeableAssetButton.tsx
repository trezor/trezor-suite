import { Button, buttonSchemeToColorsMap } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation, useTranslate } from '@suite-native/intl';

import { TradeableAssetButton } from './TradeableAssetButton';
import { TradeableAsset } from '../../types';

export type SelectAssetButtonProps = {
    onPress: () => void;
    selectedAsset: TradeableAsset | undefined;
};

export const SelectTradeableAssetButton = ({ onPress, selectedAsset }: SelectAssetButtonProps) => {
    const { translate } = useTranslate();
    const { iconColor } = buttonSchemeToColorsMap.primary;

    if (selectedAsset) {
        return (
            <TradeableAssetButton
                asset={selectedAsset}
                onPress={onPress}
                accessibilityLabel={translate('moduleTrading.selectCoin.buttonTitle')}
                caret
            />
        );
    }

    return (
        <Button
            onPress={onPress}
            viewRight={<Icon name="caretDown" color={iconColor} size="medium" />}
            accessibilityLabel={translate('moduleTrading.selectCoin.buttonTitle')}
            size="small"
        >
            <Translation id="moduleTrading.selectCoin.buttonTitle" />
        </Button>
    );
};
