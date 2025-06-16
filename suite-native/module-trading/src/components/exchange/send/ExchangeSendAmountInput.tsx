import { forwardRef } from 'react';
import { TextInput } from 'react-native';

import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useAmountInputDecimals } from '../../../hooks/general/useAmountInputDecimals';
import { useInputFieldControls } from '../../../hooks/general/useInputFieldControls';
import { getSymbolFromTradeableAsset } from '../../../utils/general/tradeableAssetUtils';
import { AmountInput } from '../../general/Input/AmountInput';

export type ExchangeSendAmountInputProps = {
    showAssetsSheet: () => void;
};

export const ExchangeSendAmountInput = forwardRef<TextInput, ExchangeSendAmountInputProps>(
    ({ showAssetsSheet }, ref) => {
        const { translate } = useTranslate();
        const { watch, setValue } = useExchangeFormContext();
        const [asset, amount, account] = watch(['sendAsset', 'sendCryptoAmount', 'sendAccount']);
        const symbol = getSymbolFromTradeableAsset(asset);
        const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
        const inputControls = useInputFieldControls('sendCryptoAmount', amount, setValue);
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
