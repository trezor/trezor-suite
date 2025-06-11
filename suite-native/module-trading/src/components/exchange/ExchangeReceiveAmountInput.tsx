import { forwardRef } from 'react';
import { TextInput } from 'react-native';

import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { getSymbolFromTradeableAsset } from '../../../utils/general/tradeableAssetUtils';
import { AmountInput } from '../../general/Input/AmountInput';

export type ExchangeReceiveAmountInputProps = {
    showAssetsSheet: () => void;
};

const noop = () => {};

export const ExchangeReceiveAmountInput = forwardRef<TextInput, ExchangeReceiveAmountInputProps>(
    ({ showAssetsSheet }, ref) => {
        const { translate } = useTranslate();
        const { watch } = useExchangeFormContext();
        const [asset, amount] = watch(['receiveAsset', 'receiveCryptoAmount']);
        const symbol = getSymbolFromTradeableAsset(asset);
        const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);

        return (
            <AmountInput
                ref={ref}
                value={amount}
                accessibilityLabel={translate('moduleTrading.selectCoin.amountLabel')}
                editable={false}
                inputTransformer={cryptoAmountTransformer}
                onPress={showAssetsSheet}
                loadingAccessibilityLabel={translate(
                    'moduleTrading.tradingScreen.quotesLoadingLabel',
                )}
                onChangeText={noop}
            />
        );
    },
);
