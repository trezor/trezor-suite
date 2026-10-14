import { type Ref } from 'react';
import { type TextInput } from 'react-native';

import { useWatch } from '@suite-native/forms';
import { useAmountInputTransformers } from '@suite-native/helpers';
import { useTranslate } from '@suite-native/intl';
import { getSymbolFromTradeableAsset } from '@suite-native/trading-atoms';

import { CRYPTO_AMOUNT_INPUT_HIT_SLOP } from '../../../constants';
import { useExchangeFormContext } from '../../../hooks/exchange/useExchangeFormContext';
import { useExchangeInputFormControls } from '../../../hooks/exchange/useExchangeInputFormControls';
import { useAmountInputDecimals } from '../../../hooks/general/useAmountInputDecimals';
import { CryptoAmountKeyboardToolbar } from '../../general/CryptoAmountKeyboardToolbar';
import { AmountInput } from '../../general/Input/AmountInput';

export type ExchangeSendAmountInputProps = {
    onSelectAsset: () => void;
    ref?: Ref<TextInput>;
};

const EXCHANGE_SEND_INPUT_TEST_ID = '@trading/exchange/send-amount-input';

export const ExchangeSendAmountInput = ({ onSelectAsset, ref }: ExchangeSendAmountInputProps) => {
    const { translate } = useTranslate();
    const { control, metadata } = useExchangeFormContext();
    const [asset, account, focusedValue] = useWatch({
        control,
        name: ['sendAsset', 'sendAccount', 'focusedValue'],
    });
    const symbol = getSymbolFromTradeableAsset(asset);
    const { cryptoAmountTransformer } = useAmountInputTransformers(symbol);
    const inputControls = useExchangeInputFormControls();
    const decimals = useAmountInputDecimals(account, asset?.contractAddress);

    const isAssetSelected = !!asset;
    const isToolbarVisible =
        focusedValue === 'sendCryptoAmount' || focusedValue === 'sendBaseCurrencyAmount';

    return (
        <>
            <AmountInput
                ref={ref}
                hitSlop={CRYPTO_AMOUNT_INPUT_HIT_SLOP}
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
                isVisible={isToolbarVisible}
                maxSpendableAmount={metadata.maxSpendableAmount}
                onSelectAmount={amount => {
                    inputControls.onChangeText(amount);
                }}
            />
        </>
    );
};
