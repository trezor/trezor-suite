import { forwardRef } from 'react';
import { type TextInput } from 'react-native';

import { useWatch } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';

import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useAmountInputDecimals } from '../../../hooks/general/useAmountInputDecimals';
import { useInputFieldControls } from '../../../hooks/general/useInputFieldControls';
import { CryptoAmountKeyboardToolbar } from '../../general/CryptoAmountKeyboardToolbar';
import { AmountInput } from '../../general/Input/AmountInput';

export type ExchangeSendAmountInputProps = {
    onSelectAsset: () => void;
};

const EXCHANGE_SEND_INPUT_TEST_ID = '@trading/exchange/send-amount-input';

export const ExchangeSendAmountInput = forwardRef<TextInput, ExchangeSendAmountInputProps>(
    ({ onSelectAsset }, ref) => {
        const { translate } = useTranslate();
        const { control, metadata, setValue } = useExchangeFormContext();
        const [asset, amount, account, focusedValue] = useWatch({
            control,
            name: ['sendAsset', 'sendCryptoAmount', 'sendAccount', 'focusedValue'],
        });
        const symbol = getSymbolFromTradeableAsset(asset);
        const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
        const inputControls = useInputFieldControls('sendCryptoAmount', amount, setValue);
        const decimals = useAmountInputDecimals(account, asset?.contractAddress);

        const isAssetSelected = !!asset;

        return (
            <>
                <AmountInput
                    ref={ref}
                    {...inputControls}
                    accessibilityLabel={translate('moduleTrading.selectCoinToSell.amountLabel')}
                    editable={isAssetSelected}
                    inputTransformer={cryptoAmountTransformer}
                    maxDecimals={decimals}
                    onPress={isAssetSelected ? undefined : onSelectAsset}
                    loadingAccessibilityLabel={translate(
                        'moduleTrading.tradingScreen.quotesLoadingLabel',
                    )}
                    testID={EXCHANGE_SEND_INPUT_TEST_ID}
                />
                <CryptoAmountKeyboardToolbar
                    accountKey={account?.key}
                    symbol={account?.symbol}
                    contractAddress={asset?.contractAddress}
                    decimals={decimals}
                    isVisible={focusedValue === 'sendCryptoAmount'}
                    maxSpendableAmount={metadata.maxSpendableAmount}
                    onSelectAmount={selectedAmount => {
                        inputControls.onChangeText(selectedAmount);
                    }}
                />
            </>
        );
    },
);
