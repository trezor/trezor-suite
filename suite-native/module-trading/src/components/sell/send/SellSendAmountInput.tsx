import { forwardRef } from 'react';
import { TextInput } from 'react-native';

import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { useAmountInputDecimals } from '../../../hooks/general/useAmountInputDecimals';
import { useInputFieldControls } from '../../../hooks/general/useInputFieldControls';
import { useSellFormContext } from '../../../hooks/sell/useSellFormContext';
import { getSymbolFromTradeableAsset } from '../../../utils/general/tradeableAssetUtils';
import { AmountInput } from '../../general/Input/AmountInput';

export type SellSendAmountInputProps = {
    showAssetsSheet: () => void;
};

export const SellSendAmountInput = forwardRef<TextInput, SellSendAmountInputProps>(
    ({ showAssetsSheet }, ref) => {
        const { translate } = useTranslate();
        const { watch, setValue } = useSellFormContext();
        const [asset, amount, account] = watch(['sendAsset', 'cryptoStringAmount', 'sendAccount']);
        const symbol = getSymbolFromTradeableAsset(asset);
        const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
        const inputControls = useInputFieldControls('cryptoStringAmount', amount, setValue);
        const decimals = useAmountInputDecimals(account, asset?.contractAddress);

        const isAssetSelected = !!asset;

        return (
            <AmountInput
                ref={ref}
                {...inputControls}
                accessibilityLabel={translate('moduleTrading.selectCoinToSell.amountLabel')}
                editable={isAssetSelected}
                inputTransformer={cryptoAmountTransformer}
                maxDecimals={decimals}
                onPress={isAssetSelected ? undefined : showAssetsSheet}
                loadingAccessibilityLabel={translate(
                    'moduleTrading.tradingScreen.quotesLoadingLabel',
                )}
            />
        );
    },
);
