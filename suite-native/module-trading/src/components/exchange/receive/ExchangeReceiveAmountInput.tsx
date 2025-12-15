import { forwardRef } from 'react';
import { type TextInput } from 'react-native';
import { useSelector } from 'react-redux';

import { selectTradingExchangeIsLoading } from '@suite-common/trading';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { AmountInput } from '../../general/Input/AmountInput';

export type ExchangeReceiveAmountInputProps = {
    showAssetsSheet: () => void;
};

const EXCHANGE_RECEIVE_INPUT_TEST_ID = '@trading/exchange/receive-amount-input';

const noop = () => {};

export const ExchangeReceiveAmountInput = forwardRef<TextInput, ExchangeReceiveAmountInputProps>(
    ({ showAssetsSheet }, ref) => {
        const { translate } = useTranslate();
        const isLoading = useSelector(selectTradingExchangeIsLoading);
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
                isLoading={isLoading}
                testID={EXCHANGE_RECEIVE_INPUT_TEST_ID}
            />
        );
    },
);
